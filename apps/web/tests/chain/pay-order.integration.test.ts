import { inArray } from "drizzle-orm";
import {
  createTestClient,
  createWalletClient,
  encodeAbiParameters,
  keccak256,
  parseEther,
  toHex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { v7 } from "uuid";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { signOrder } from "@workspace/payments/typed-data";

import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { getDb } from "@/lib/db/client";
import { orders, user } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { verifyPayOrder } from "@/lib/orders/pay-order";
import { toReservedOrder } from "@/lib/orders/reserved-order";
import { toSignableOrder } from "@/src/helpers/order-schema";
import { reservationInput } from "../lib/orders/order-fixture";
import { startRouterFork } from "./fork-harness";

const owner = privateKeyToAccount(keccak256(toHex("pay-order-chain-test-owner")));
const merchant = privateKeyToAccount(keccak256(toHex("pay-order-chain-test-merchant"))).address;
const device = privateKeyToAccount(keccak256(toHex("pay-order-chain-test-device")));
const rotatedKey = privateKeyToAccount(keccak256(toHex("pay-order-chain-test-rotated"))).address;
// `paid` is storage slot 8 per `forge inspect PaymentRouter storageLayout`.
const PAID_SLOT = 8n;
const merchantId = v7();
let fork: Awaited<ReturnType<typeof startRouterFork>>;

beforeAll(async () => {
  fork = await startRouterFork(owner, [owner]);
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", fork.domain.router);
  vi.stubEnv("ARBITRUM_RPC_URL", fork.rpcUrl);
  await getDb()
    .insert(user)
    .values({ id: merchantId, name: "Merchant", email: `${merchantId}@example.com` });
});

afterAll(async () => {
  fork?.anvil.kill();
  vi.unstubAllEnvs();
  await getDb()
    .delete(orders)
    .where(inArray(orders.merchantId, [merchantId]));
  await getDb()
    .delete(user)
    .where(inArray(user.id, [merchantId]));
});

function testClient() {
  return createTestClient({ chain: arbitrum, mode: "anvil", transport: fork.transport });
}

async function setSigningKey(signingKey: Address) {
  await testClient().setBalance({ address: merchant, value: parseEther("1") });
  await testClient().impersonateAccount({ address: merchant });
  const hash = await createWalletClient({
    account: merchant,
    chain: arbitrum,
    transport: fork.transport,
  }).writeContract({
    address: fork.domain.router,
    abi: paymentRouterAbi,
    functionName: "setSigningKey",
    args: [signingKey],
  });
  await fork.publicClient.waitForTransactionReceipt({ hash });
  await testClient().stopImpersonatingAccount({ address: merchant });
}

function paidSlot(orderId: `0x${string}`) {
  const inner = keccak256(
    encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [merchant, PAID_SLOT]),
  );
  return keccak256(
    encodeAbiParameters([{ type: "bytes32" }, { type: "bytes32" }], [orderId, inner]),
  );
}

const verify = (id: string) => verifyPayOrder(id, drizzleOrderRepository, getRouterReader);

it("verifies against the live signing key, then reflects rotation and payment", async () => {
  await setSigningKey(device.address);
  const reserved = await drizzleOrderRepository.create({
    ...reservationInput(merchantId),
    merchantAddress: merchant,
  });
  const order = toSignableOrder(toReservedOrder(reserved));
  const signer = createWalletClient({
    account: device,
    chain: arbitrum,
    transport: fork.transport,
  });
  const signature = await signOrder(signer, fork.domain, order);
  expect(await drizzleOrderRepository.attachSignature(reserved.id, signature)).not.toBeNull();

  const display = { amount: "123.45", token: "USDT" };
  expect(await verify(reserved.id)).toEqual({ status: "valid", display });

  await setSigningKey(rotatedKey);
  expect(await verify(reserved.id)).toEqual({ status: "invalid" });

  await testClient().setStorageAt({
    address: fork.domain.router,
    index: paidSlot(order.orderId),
    value: toHex(1n, { size: 32 }),
  });
  expect(await verify(reserved.id)).toEqual({ status: "paid", display });
});

it("reports an RPC failure as unverified, never valid", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  await setSigningKey(device.address);
  const reserved = await drizzleOrderRepository.create({
    ...reservationInput(merchantId),
    merchantAddress: merchant,
  });
  const signer = createWalletClient({
    account: device,
    chain: arbitrum,
    transport: fork.transport,
  });
  const signature = await signOrder(
    signer,
    fork.domain,
    toSignableOrder(toReservedOrder(reserved)),
  );
  await drizzleOrderRepository.attachSignature(reserved.id, signature);
  expect(await verify(reserved.id)).toMatchObject({ status: "valid" });

  vi.stubEnv("ARBITRUM_RPC_URL", "http://127.0.0.1:1");
  expect(await verify(reserved.id)).toEqual({ status: "unverified" });
  vi.stubEnv("ARBITRUM_RPC_URL", fork.rpcUrl);
});
