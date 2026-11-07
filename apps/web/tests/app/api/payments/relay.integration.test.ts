import { eq, inArray } from "drizzle-orm";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { afterEach, expect, test, vi } from "vitest";
import { z } from "zod";

import { POST } from "@/app/api/payments/relay/route";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { user, verification, walletAddress } from "@/lib/db/schema";

const baseURL = "http://localhost:3000";
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];

afterEach(async () => {
  const db = getDb();
  if (addresses.length) await db.delete(user).where(inArray(user.name, addresses));
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
  addresses.length = 0;
  nonceIdentifiers.length = 0;
  vi.unstubAllEnvs();
});

async function authRequest(path: string, body: unknown): Promise<Response> {
  return getAuth().handler(
    new Request(`${baseURL}/api/auth${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: JSON.stringify(body),
    }),
  );
}

async function signIn() {
  const wallet = privateKeyToAccount(generatePrivateKey());
  addresses.push(wallet.address);
  const nonceResponse = await authRequest("/siwe/nonce", {});
  const { nonce } = z.object({ nonce: z.string() }).parse(await nonceResponse.json());
  nonceIdentifiers.push(`siwe:${nonce}`);
  const message = createSiweMessage({
    address: wallet.address,
    chainId: arbitrum.id,
    domain: "localhost:3000",
    uri: baseURL,
    version: "1",
    nonce,
  });
  const response = await authRequest("/siwe/verify", {
    message,
    signature: await wallet.signMessage({ message }),
  });
  expect(response.status).toBe(200);
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const { user: signedInUser } = z
    .object({ user: z.object({ id: z.uuidv7() }) })
    .parse(await response.json());
  return { wallet, cookie, userId: signedInUser.id };
}

function relay(body: string, cookie?: string): Promise<Response> {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (cookie) headers.set("cookie", cookie);
  return POST(new Request(`${baseURL}/api/payments/relay`, { method: "POST", headers, body }));
}

function paymentBody(payer: string) {
  const bytes32 = `0x${"11".repeat(32)}`;
  const otherAddress = privateKeyToAccount(generatePrivateKey()).address;
  return {
    order: {
      merchant: otherAddress,
      receiveToken: otherAddress,
      receiveAmount: "1000000",
      orderId: bytes32,
      expiry: "4102444800",
      feeBps: 30,
    },
    merchantSignature: `0x${"22".repeat(65)}`,
    intent: { payer, payToken: otherAddress, maxPayAmount: "1010000", orderHash: bytes32 },
    payerSignature: `0x${"33".repeat(65)}`,
  };
}

async function expectError(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(z.object({ error: z.string() }).parse(await response.json())).toBeTruthy();
}

test("rejects requests without a session", async () => {
  const payer = privateKeyToAccount(generatePrivateKey()).address;
  await expectError(await relay(JSON.stringify(paymentBody(payer))), 401);
});

test("rejects malformed payment bodies from a signed-in user", async () => {
  const { wallet, cookie } = await signIn();
  const valid = paymentBody(wallet.address);

  await expectError(await relay("{not json", cookie), 400);
  await expectError(await relay(JSON.stringify({ ...valid, intent: undefined }), cookie), 400);
  await expectError(
    await relay(JSON.stringify({ ...valid, order: { ...valid.order, feeBps: 65_536 } }), cookie),
    400,
  );
  await expectError(
    await relay(JSON.stringify({ ...valid, order: { ...valid.order, expiry: "1.5" } }), cookie),
    400,
  );
  await expectError(
    await relay(
      JSON.stringify({ ...valid, order: { ...valid.order, expiry: (2n ** 64n).toString() } }),
      cookie,
    ),
    400,
  );
  await expectError(
    await relay(
      JSON.stringify({ ...valid, intent: { ...valid.intent, orderHash: "0x11" } }),
      cookie,
    ),
    400,
  );
});

test("rejects payments whose payer is not the session's primary wallet", async () => {
  const { wallet, cookie, userId } = await signIn();
  const otherPayer = privateKeyToAccount(generatePrivateKey()).address;
  await expectError(await relay(JSON.stringify(paymentBody(otherPayer)), cookie), 403);

  await getDb()
    .update(walletAddress)
    .set({ isPrimary: false })
    .where(eq(walletAddress.userId, userId));
  await expectError(await relay(JSON.stringify(paymentBody(wallet.address)), cookie), 403);
});

test("reads relayer config only after the payer check passes", async () => {
  vi.stubEnv("RELAYER_PRIVATE_KEY", "");
  const { wallet, cookie } = await signIn();
  await expect(relay(JSON.stringify(paymentBody(wallet.address)), cookie)).rejects.toThrow(
    "RELAYER_PRIVATE_KEY",
  );
});
