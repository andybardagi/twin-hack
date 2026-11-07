import { eq, inArray } from "drizzle-orm";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { afterEach, expect, test } from "vitest";
import { z } from "zod";
import { v7 } from "uuid";

import { getAuth } from "@/lib/auth";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";
import { getDb } from "@/lib/db/client";
import { user, verification, walletAddress } from "@/lib/db/schema";

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

async function signedAttempt() {
  const wallet = privateKeyToAccount(generatePrivateKey());
  addresses.push(wallet.address);
  const response = await request("/siwe/nonce", {});
  expect(response.status).toBe(200);
  const { nonce } = z.object({ nonce: z.string() }).parse(await response.json());
  nonceIdentifiers.push(`siwe:${nonce}`);
  const message = createSiweMessage({
    address: wallet.address,
    chainId: arbitrum.id,
    domain: "localhost:3000",
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

test("address lookup uses only the signed-in user's primary wallet", async () => {
  const first = await signedAttempt();
  const firstResponse = await request("/siwe/verify", {
    message: first.message,
    signature: first.signature,
  });
  expect(firstResponse.status).toBe(200);
  const second = await signedAttempt();
  const secondResponse = await request("/siwe/verify", {
    message: second.message,
    signature: second.signature,
  });
  expect(secondResponse.status).toBe(200);

  const cookie = firstResponse.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const signedIn = await getAuth().api.getSession({ headers: new Headers({ cookie }) });
  if (!signedIn) throw new Error("Sign-in did not create a session");
  const otherUser = z
    .object({ user: z.object({ id: z.uuidv7() }) })
    .parse(await secondResponse.json());
  const db = getDb();
  await db.insert(walletAddress).values({
    id: v7(),
    userId: signedIn.user.id,
    address: second.wallet.address,
    chainId: arbitrum.id,
    isPrimary: false,
    createdAt: new Date(),
  });

  expect(await getPrimaryWalletAddress(signedIn.user.id)).toBe(first.wallet.address);
  expect(await getPrimaryWalletAddress(otherUser.user.id)).toBe(second.wallet.address);
  await db
    .update(walletAddress)
    .set({ isPrimary: false })
    .where(eq(walletAddress.userId, signedIn.user.id));
  expect(await getPrimaryWalletAddress(signedIn.user.id)).toBeNull();
  expect(await getPrimaryWalletAddress(v7())).toBeNull();
});
