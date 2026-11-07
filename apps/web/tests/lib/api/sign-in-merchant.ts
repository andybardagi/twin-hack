import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { expect } from "vitest";
import { z } from "zod";

import { POST as authPOST } from "@/app/api/auth/[...all]/route";

const baseURL = "http://localhost:3000";

export async function signInMerchant(addresses: string[], nonceIdentifiers: string[]) {
  const wallet = privateKeyToAccount(generatePrivateKey());
  addresses.push(wallet.address);
  const nonceResponse = await authPOST(
    new Request(`${baseURL}/api/auth/siwe/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: "{}",
    }),
  );
  expect(nonceResponse.status).toBe(200);
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
  const response = await authPOST(
    new Request(`${baseURL}/api/auth/siwe/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: JSON.stringify({ message, signature: await wallet.signMessage({ message }) }),
    }),
  );
  expect(response.status).toBe(200);
  const result = z.object({ user: z.object({ id: z.uuidv7() }) }).parse(await response.json());
  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return { merchantId: result.user.id, cookie };
}
