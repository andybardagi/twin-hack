import { createServer } from "node:http";
import { inArray } from "drizzle-orm";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { user, verification } from "@/lib/db/schema";

const baseURL = "http://localhost:3000";
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];
const rpcMethods: string[] = [];
let rpcStatus = 200;
const server = createServer(async (request, response) => {
  let body = "";
  for await (const chunk of request) body += chunk;
  const { id, method } = z.object({ id: z.number(), method: z.string() }).parse(JSON.parse(body));
  rpcMethods.push(method);
  response.writeHead(rpcStatus, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ jsonrpc: "2.0", id, result: `0x${"0".repeat(63)}1` }));
});

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("RPC stub has no TCP address");
  process.env.ARBITRUM_RPC_URL = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

afterEach(async () => {
  const db = getDb();
  if (addresses.length) await db.delete(user).where(inArray(user.name, addresses));
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
  addresses.length = 0;
  nonceIdentifiers.length = 0;
  rpcMethods.length = 0;
});

async function request(path: string, body: unknown): Promise<Response> {
  return getAuth().handler(
    new Request(`${baseURL}/api/auth${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: baseURL },
      body: JSON.stringify(body),
    }),
  );
}

test.each([
  { rpcStatus: 200, signInStatus: 200 },
  { rpcStatus: 500, signInStatus: 401 },
])("smart wallet sign-in returns $signInStatus when RPC returns $rpcStatus", async (scenario) => {
  rpcStatus = scenario.rpcStatus;
  const wallet = privateKeyToAccount(generatePrivateKey());
  addresses.push(wallet.address);
  const nonceResponse = await request("/siwe/nonce", {});
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
  // A 66-byte smart wallet signature cannot be recovered as an EOA signature.
  const signature = `0x${"ab".repeat(66)}`;
  const response = await request("/siwe/verify", { message, signature });
  expect(response.status).toBe(scenario.signInStatus);
  expect(rpcMethods).toEqual(["eth_call"]);
  if (scenario.signInStatus === 200) {
    expect(await response.json()).toMatchObject({ success: true });
  } else {
    expect(await response.json()).toMatchObject({
      message: "Unauthorized: Invalid SIWE signature",
    });
  }
});
