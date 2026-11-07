import { erc20Abi, keccak256, parseUnits, toHex, type Address, type Hex } from "viem";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { paymentRouterAbi } from "../src/abi";
import { submitPayment } from "../src/pay";
import { tokens } from "../src/tokens";
import { hashOrder, signIntent, signOrder, type Order, type RouterDomain } from "../src/typed-data";
import { verifyOrder } from "../src/verify-order";
import {
  customer,
  FEE_BPS,
  merchant,
  merchantSigner,
  owner,
  startArbitrumFork,
  type ArbitrumFork,
} from "./arbitrum-fork";

const ORDER_TTL_SECONDS = 600n;
const RECEIVE_AMOUNT = parseUnits("1", tokens.USDT0.decimals);
// WETH on Arbitrum One: a real token the router has no pool for.
const UNSUPPORTED_TOKEN: Address = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

describe("verifyOrder on an Arbitrum fork", () => {
  let fork: ArbitrumFork;
  let domain: RouterDomain;
  // The merchant routes settlements here, so this address paying counts as self-payment.
  const payout = owner.address;

  beforeAll(async () => {
    fork = await startArbitrumFork();
    domain = { chainId: arbitrum.id, router: fork.router };
    await fork.publicClient.waitForTransactionReceipt({
      hash: await fork.walletFor(merchant).writeContract({
        address: fork.router,
        abi: paymentRouterAbi,
        functionName: "setPayoutAddress",
        args: [payout],
      }),
    });
  });

  afterAll(() => {
    fork?.stop();
  });

  async function buildOrder(label: string, overrides: Partial<Order> = {}): Promise<Order> {
    const { timestamp } = await fork.publicClient.getBlock();
    return {
      merchant: merchant.address,
      receiveToken: tokens.USDT0.address,
      receiveAmount: RECEIVE_AMOUNT,
      orderId: keccak256(toHex(label)),
      expiry: timestamp + ORDER_TTL_SECONDS,
      feeBps: FEE_BPS,
      ...overrides,
    };
  }

  const signByMerchant = (order: Order) => signOrder(fork.walletFor(merchantSigner), domain, order);

  const verify = (order: Order, merchantSignature: Hex, payer: Address = customer.address) =>
    verifyOrder(fork.publicClient, { router: fork.router, order, merchantSignature, payer });

  it("accepts a fresh order signed by the merchant's key", async () => {
    const order = await buildOrder("valid");
    expect(await verify(order, await signByMerchant(order))).toEqual({ kind: "valid" });
  });

  it("rejects a merchant with no signing key", async () => {
    const order = await buildOrder("no-key", { merchant: customer.address });
    expect(await verify(order, await signByMerchant(order), owner.address)).toEqual({
      kind: "invalid",
      reason: "no-signing-key",
    });
  });

  it("rejects an order signed by another key", async () => {
    const order = await buildOrder("wrong-signer");
    const signature = await signOrder(fork.walletFor(customer), domain, order);
    expect(await verify(order, signature)).toEqual({ kind: "invalid", reason: "wrong-signer" });
  });

  it("rejects a malformed signature as wrong-signer", async () => {
    const order = await buildOrder("malformed");
    expect(await verify(order, "0x1234")).toEqual({ kind: "invalid", reason: "wrong-signer" });
  });

  it("rejects an order whose fee no longer matches the router", async () => {
    const order = await buildOrder("fee-changed", { feeBps: FEE_BPS + 1 });
    expect(await verify(order, await signByMerchant(order))).toEqual({
      kind: "invalid",
      reason: "fee-changed",
    });
  });

  it("rejects an order past its expiry", async () => {
    const { timestamp } = await fork.publicClient.getBlock();
    const order = await buildOrder("expired", { expiry: timestamp - 1n });
    expect(await verify(order, await signByMerchant(order))).toEqual({
      kind: "invalid",
      reason: "expired",
    });
  });

  it("rejects an order that was already paid", async () => {
    const order = await buildOrder("already-paid");
    const merchantSignature = await signByMerchant(order);
    await fork.fundCustomer(tokens.USDT0.address, tokens.ARGt.pool, RECEIVE_AMOUNT);
    await fork.publicClient.waitForTransactionReceipt({
      hash: await fork.walletFor(customer).writeContract({
        address: tokens.USDT0.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [fork.router, RECEIVE_AMOUNT],
      }),
    });
    const intent = {
      payer: customer.address,
      payToken: tokens.USDT0.address,
      maxPayAmount: RECEIVE_AMOUNT,
      orderHash: hashOrder(domain, order),
    };
    await submitPayment(fork.walletFor(owner), fork.publicClient, {
      router: fork.router,
      order,
      merchantSignature,
      intent,
      payerSignature: await signIntent(fork.walletFor(customer), domain, intent),
    });

    expect(await verify(order, merchantSignature)).toEqual({
      kind: "invalid",
      reason: "already-paid",
    });
  });

  it("rejects a receive token the router does not support", async () => {
    const order = await buildOrder("unsupported", { receiveToken: UNSUPPORTED_TOKEN });
    expect(await verify(order, await signByMerchant(order))).toEqual({
      kind: "invalid",
      reason: "unsupported-token",
    });
  });

  it.each([
    ["the merchant", merchant.address],
    ["the merchant's payout address", payout],
  ])("rejects a payment by %s as self-payment", async (_, payer) => {
    const order = await buildOrder(`self-payment-${payer}`);
    expect(await verify(order, await signByMerchant(order), payer)).toEqual({
      kind: "invalid",
      reason: "self-payment",
    });
  });
});
