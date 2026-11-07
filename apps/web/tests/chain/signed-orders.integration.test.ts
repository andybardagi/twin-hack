import { inArray } from "drizzle-orm";
import {
  createTestClient,
  createWalletClient,
  getAddress,
  hexToBigInt,
  isHex,
  keccak256,
  numberToHex,
  parseEther,
  parseSignature,
  recoverAddress,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { z } from "zod";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { tokens } from "@workspace/payments/tokens";
import { hashOrder, noPermit, signOrder, type Order } from "@workspace/payments/typed-data";

import { POST } from "@/app/api/[[...slugs]]/route";
import { getDb } from "@/lib/db/client";
import { orders, user, verification } from "@/lib/db/schema";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { reservationExpiresAt, toReservedOrder } from "@/lib/orders/reserved-order";
import { reservedOrderSchema, toSignableOrder } from "@/src/helpers/order-schema";
import { signInMerchant } from "../lib/api/sign-in-merchant";
import { startRouterFork } from "./fork-harness";

const baseURL = "http://localhost:3000";
const owner = privateKeyToAccount(keccak256(toHex("signed-orders-test-owner")));
const device = privateKeyToAccount(keccak256(toHex("signed-orders-test-device")));
const wrongKey = privateKeyToAccount(keccak256(toHex("signed-orders-test-wrong-key")));
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];
let fork: Awaited<ReturnType<typeof startRouterFork>>;

beforeAll(async () => {
  fork = await startRouterFork(owner, [owner]);
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

function post(path: string, body: unknown, cookie: string) {
  return POST(
    new Request(`${baseURL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify(body),
    }),
  );
}

function sign(account: PrivateKeyAccount, order: Order) {
  const signer = createWalletClient({ account, chain: arbitrum, transport: fork.transport });
  return signOrder(signer, fork.domain, order);
}

async function registerSigningKey(merchant: Hex) {
  const testClient = createTestClient({
    chain: arbitrum,
    mode: "anvil",
    transport: fork.transport,
  });
  await testClient.setBalance({ address: merchant, value: parseEther("1") });
  await testClient.impersonateAccount({ address: merchant });
  const hash = await createWalletClient({
    account: merchant,
    chain: arbitrum,
    transport: fork.transport,
  }).writeContract({
    address: fork.domain.router,
    abi: paymentRouterAbi,
    functionName: "setSigningKey",
    args: [device.address],
  });
  await fork.publicClient.waitForTransactionReceipt({ hash });
  await testClient.stopImpersonatingAccount({ address: merchant });
}

function simulatePay(order: Order, merchantSig: Hex) {
  return fork.publicClient.simulateContract({
    account: owner,
    address: fork.domain.router,
    abi: paymentRouterAbi,
    functionName: "pay",
    args: [
      order,
      merchantSig,
      {
        payer: owner.address,
        payToken: tokens.USDT0.address,
        maxPayAmount: 0n,
        orderHash: hashOrder(fork.domain, order),
      },
      `0x${"11".repeat(65)}`,
      noPermit,
    ],
  });
}

const secp256k1Order = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** Same key and digest, malleated to (r, n - s) with v flipped: viem recovers it, OpenZeppelin doesn't. */
function highS(signature: Hex): Hex {
  const { r, s, v } = parseSignature(signature);
  const flippedV = v === 27n ? "1c" : "1b";
  return `${r}${numberToHex(secp256k1Order - hexToBigInt(s), { size: 32 }).slice(2)}${flippedV}`;
}

/** Same signature with v as a 0/1 parity byte instead of 27/28. */
function yParityV(signature: Hex): Hex {
  const { v } = parseSignature(signature);
  return `0x${signature.slice(2, 130)}${v === 27n ? "00" : "01"}`;
}

it("reserves, signs with the device key and stores an order the router accepts", async () => {
  const { merchantId, cookie } = await signInMerchant(addresses, nonceIdentifiers);
  const merchant = getAddress(z.string().parse(addresses.at(-1)));
  await registerSigningKey(merchant);

  const reserveResponse = await post(
    "/orders",
    {
      tokenAddress: tokens.USDT0.address,
      amount: "12.34",
      merchant: owner.address,
      expiry: 1,
      feeBps: 0,
    },
    cookie,
  );
  expect(reserveResponse.status).toBe(201);
  const reserved = reservedOrderSchema.parse(await reserveResponse.json());
  expect(reserved).toMatchObject({ merchant, feeBps: 50 });
  const order = toSignableOrder(reserved);
  const signatureUrl = `/orders/${reserved.id}/signature`;

  const signature = await sign(device, order);
  const tampered = await sign(device, { ...order, receiveAmount: order.receiveAmount + 1n });
  const invalidSignatures = [
    await sign(wrongKey, order),
    tampered,
    `0x${"00".repeat(65)}`,
    highS(signature),
    yParityV(signature),
  ];
  for (const invalidSignature of invalidSignatures) {
    const response = await post(signatureUrl, { signature: invalidSignature }, cookie);
    expect(response.status).toBe(422);
  }
  expect(await drizzleOrderRepository.findById(reserved.id)).toBeNull();

  const other = await signInMerchant(addresses, nonceIdentifiers);
  expect((await post(signatureUrl, { signature }, other.cookie)).status).toBe(404);

  const attachResponse = await post(signatureUrl, { signature }, cookie);
  expect(attachResponse.status).toBe(200);
  expect(await attachResponse.json()).toEqual({ id: reserved.id });
  expect((await post(signatureUrl, { signature }, cookie)).status).toBe(409);

  const stored = await drizzleOrderRepository.findById(reserved.id);
  if (!stored?.signature) throw new Error("Signed order was not stored");
  expect(stored.merchantId).toBe(merchantId);
  const storedOrder = toSignableOrder(toReservedOrder(stored));
  expect(storedOrder).toEqual(order);
  const storedSignature = stored.signature;
  if (!isHex(storedSignature)) throw new Error("Stored signature is not hex");
  const digest = hashOrder(fork.domain, storedOrder);
  expect(
    await fork.publicClient.readContract({
      address: fork.domain.router,
      abi: paymentRouterAbi,
      functionName: "hashOrder",
      args: [storedOrder],
    }),
  ).toBe(digest);
  expect(await recoverAddress({ hash: digest, signature: storedSignature })).toBe(device.address);
  // Reaching the payer check proves the contract accepted the merchant signature.
  await expect(simulatePay(storedOrder, storedSignature)).rejects.toThrow("InvalidPayerSignature");
  await expect(simulatePay({ ...storedOrder, feeBps: 0 }, storedSignature)).rejects.toThrow(
    "InvalidMerchantSignature",
  );
});

it("refuses to attach a valid signature to an expired order", async () => {
  const { merchantId, cookie } = await signInMerchant(addresses, nonceIdentifiers);
  const merchant = getAddress(z.string().parse(addresses.at(-1)));
  await registerSigningKey(merchant);
  const expired = await drizzleOrderRepository.create({
    merchantId,
    merchantAddress: merchant,
    tokenAddress: getAddress(tokens.USDT0.address),
    amount: "12340000",
    expiresAt: reservationExpiresAt(new Date(Date.now() - 16 * 60 * 1000)),
    feeBps: 50,
  });
  const signature = await sign(device, toSignableOrder(toReservedOrder(expired)));

  const response = await post(`/orders/${expired.id}/signature`, { signature }, cookie);
  expect(response.status).toBe(409);
  expect(await drizzleOrderRepository.findById(expired.id)).toBeNull();
});
