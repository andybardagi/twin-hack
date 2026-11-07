import { eq, inArray } from "drizzle-orm";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { afterEach, expect, test } from "vitest";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { account, session, user, verification, walletAddress } from "@/lib/db/schema";

const baseURL = "http://localhost:3000";
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];

async function request(path: string, body: unknown): Promise<Response> {
  return getAuth().handler(
    new Request(`${baseURL}/api/auth${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: JSON.stringify(body),
    }),
  );
}

async function signedAttempt(domain = "localhost:3000", chainId: number = arbitrum.id) {
  const wallet = privateKeyToAccount(generatePrivateKey());
  addresses.push(wallet.address);
  const response = await request("/siwe/nonce", {});
  expect(response.status).toBe(200);
  const { nonce } = z.object({ nonce: z.string() }).parse(await response.json());
  nonceIdentifiers.push(`siwe:${nonce}`);
  const message = createSiweMessage({
    address: wallet.address,
    chainId,
    domain,
    uri: baseURL,
    version: "1",
    nonce,
  });
  return { wallet, message, signature: await wallet.signMessage({ message }) };
}

afterEach(async () => {
  const db = getDb();
  if (addresses.length) await db.delete(user).where(inArray(user.name, addresses));
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
  addresses.length = 0;
  nonceIdentifiers.length = 0;
});

test("EOA sign-in creates a session and Arbitrum wallet", async () => {
  const { wallet, message, signature } = await signedAttempt();
  const response = await request("/siwe/verify", { message, signature });
  expect(response.status).toBe(200);
  const result = z
    .object({ success: z.literal(true), user: z.object({ id: z.uuidv7() }) })
    .parse(await response.json());
  const db = getDb();
  const wallets = await db
    .select()
    .from(walletAddress)
    .where(eq(walletAddress.userId, result.user.id));
  expect(wallets).toMatchObject([
    { address: wallet.address, chainId: arbitrum.id, isPrimary: true },
  ]);
  expect(z.uuidv7().safeParse(wallets[0]?.id).success).toBe(true);
  const sessions = await db.select().from(session).where(eq(session.userId, result.user.id));
  expect(sessions).toHaveLength(1);
  expect(z.uuidv7().safeParse(sessions[0]?.id).success).toBe(true);
  const accounts = await db.select().from(account).where(eq(account.userId, result.user.id));
  expect(accounts).toMatchObject([
    { providerId: "siwe", accountId: `${wallet.address}:${arbitrum.id}` },
  ]);
  expect(z.uuidv7().safeParse(accounts[0]?.id).success).toBe(true);

  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const sessionResponse = await getAuth().handler(
    new Request(`${baseURL}/api/auth/get-session`, {
      headers: { cookie },
    }),
  );
  expect(sessionResponse.status).toBe(200);
  expect(await sessionResponse.json()).toMatchObject({ user: { id: result.user.id } });

  const signOut = await getAuth().handler(
    new Request(`${baseURL}/api/auth/sign-out`, {
      method: "POST",
      headers: { cookie, Origin: baseURL },
    }),
  );
  expect(signOut.status).toBe(200);
  expect(await db.select().from(session).where(eq(session.userId, result.user.id))).toHaveLength(0);
});

test("a consumed nonce cannot be replayed", async () => {
  const { message, signature } = await signedAttempt();
  expect((await request("/siwe/verify", { message, signature })).status).toBe(200);
  const replay = await request("/siwe/verify", { message, signature });
  expect(replay.status).toBe(401);
  expect(await replay.json()).toMatchObject({ code: "UNAUTHORIZED_INVALID_OR_EXPIRED_NONCE" });
});

test("a signature for another domain is rejected", async () => {
  const { message, signature } = await signedAttempt("other.example");
  const response = await request("/siwe/verify", { message, signature });
  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({ code: "UNAUTHORIZED_SIWE_MESSAGE_MISMATCH" });
});

test("a signature for another chain is rejected", async () => {
  const { message, signature } = await signedAttempt("localhost:3000", 1);
  expect((await request("/siwe/verify", { message, signature })).status).toBe(401);
});

test("a signature from another wallet is rejected", async () => {
  const { message } = await signedAttempt();
  const otherWallet = privateKeyToAccount(generatePrivateKey());
  const signature = await otherWallet.signMessage({ message });
  const response = await request("/siwe/verify", { message, signature });
  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({ message: "Unauthorized: Invalid SIWE signature" });
});

test.each([
  "not-hex",
  "0x12",
  `0x${"00".repeat(65)}`,
  `0x${"00".repeat(64)}1b`,
  `0x${"ab".repeat(66)}`,
])("malformed signature %s fails sign-in", async (signature) => {
  const { message } = await signedAttempt();
  const response = await request("/siwe/verify", { message, signature });
  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({
    message: "Unauthorized: Invalid SIWE signature",
  });
});
