import { eq, inArray } from "drizzle-orm";
import {
  createTestClient,
  createWalletClient,
  erc20Abi,
  getAddress,
  keccak256,
  parseEther,
  toHex,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { z } from "zod";

import { submitPayment } from "@workspace/payments/pay";
import { tokens } from "@workspace/payments/tokens";
import { hashOrder, signIntent, signOrder } from "@workspace/payments/typed-data";

import { GET, POST } from "@/app/api/[[...slugs]]/route";
import { getDb } from "@/lib/db/client";
import { orders, user, verification } from "@/lib/db/schema";
import { reservedOrderSchema, toSignableOrder } from "@/src/helpers/order-schema";
import { signInMerchant } from "../lib/api/sign-in-merchant";
import { registerSigningKey, startRouterFork } from "./fork-harness";

const baseURL = "http://localhost:3000";
// Anvil's default accounts carry EIP-7702 delegations on Arbitrum, so use fresh keys.
const testAccount = (label: string) =>
  privateKeyToAccount(keccak256(toHex(`order-settlement-test-${label}`)));
const owner = testAccount("owner");
const device = testAccount("device");
const customer = testAccount("customer");
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];
let fork: Awaited<ReturnType<typeof startRouterFork>>;

beforeAll(async () => {
  fork = await startRouterFork(owner, [owner, customer]);
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", fork.domain.router);
  vi.stubEnv("ARBITRUM_RPC_URL", fork.rpcUrl);
});

afterAll(async () => {
  fork?.anvil.kill();
  vi.unstubAllEnvs();
  const db = getDb();
  if (addresses.length) {
    const merchants = db.select({ id: user.id }).from(user).where(inArray(user.name, addresses));
    await db.delete(orders).where(inArray(orders.merchantId, merchants));
    await db.delete(user).where(inArray(user.name, addresses));
  }
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
});

const walletFor = (account: PrivateKeyAccount) =>
  createWalletClient({ account, chain: arbitrum, transport: fork.transport });

async function readStatus(id: string, cookie: string) {
  const response = await GET(
    new Request(`${baseURL}/api/orders/${id}/status`, { headers: { cookie } }),
  );
  expect(response.status).toBe(200);
  return response.json();
}

async function readSettledAt(id: string) {
  const [stored] = await getDb()
    .select({ settledAt: orders.settledAt })
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);
  return stored?.settledAt;
}

async function fundAndApprove(amount: bigint) {
  // The ARGt pool holds USDT0, so it can fund the customer on the fork.
  const holder = tokens.ARGt.pool;
  const testClient = createTestClient({
    chain: arbitrum,
    mode: "anvil",
    transport: fork.transport,
  });
  await testClient.impersonateAccount({ address: holder });
  await testClient.setBalance({ address: holder, value: parseEther("1") });
  await fork.publicClient.waitForTransactionReceipt({
    hash: await createWalletClient({
      account: holder,
      chain: arbitrum,
      transport: fork.transport,
    }).writeContract({
      address: tokens.USDT0.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [customer.address, amount],
    }),
  });
  await testClient.stopImpersonatingAccount({ address: holder });
  await fork.publicClient.waitForTransactionReceipt({
    hash: await walletFor(customer).writeContract({
      address: tokens.USDT0.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [fork.domain.router, amount],
    }),
  });
}

it("flips a stored order to paid after a real payment and writes settled_at once", async () => {
  const { cookie } = await signInMerchant(addresses, nonceIdentifiers);
  const merchant = getAddress(z.string().parse(addresses.at(-1)));
  await registerSigningKey(fork, merchant, device.address);

  const post = (path: string, body: unknown) =>
    POST(
      new Request(`${baseURL}/api${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify(body),
      }),
    );
  const reserveResponse = await post("/orders", {
    tokenAddress: tokens.USDT0.address,
    amount: "12.34",
  });
  expect(reserveResponse.status).toBe(201);
  const reserved = reservedOrderSchema.parse(await reserveResponse.json());
  const order = toSignableOrder(reserved);
  const merchantSignature = await signOrder(walletFor(device), fork.domain, order);
  expect(
    (await post(`/orders/${reserved.id}/signature`, { signature: merchantSignature })).status,
  ).toBe(200);

  expect(await readStatus(reserved.id, cookie)).toEqual({ status: "open" });
  expect(await readSettledAt(reserved.id)).toBeNull();

  await fundAndApprove(order.receiveAmount);
  const intent = {
    payer: customer.address,
    payToken: tokens.USDT0.address,
    maxPayAmount: order.receiveAmount,
    orderHash: hashOrder(fork.domain, order),
  };
  await submitPayment(walletFor(owner), fork.publicClient, {
    router: fork.domain.router,
    order,
    merchantSignature,
    intent,
    payerSignature: await signIntent(walletFor(customer), fork.domain, intent),
  });

  const polls = await Promise.all([
    readStatus(reserved.id, cookie),
    readStatus(reserved.id, cookie),
  ]);
  expect(polls).toEqual([{ status: "paid" }, { status: "paid" }]);
  const settledAt = await readSettledAt(reserved.id);
  expect(settledAt).toBeInstanceOf(Date);

  expect(await readStatus(reserved.id, cookie)).toEqual({ status: "paid" });
  expect(await readSettledAt(reserved.id)).toEqual(settledAt);
});
