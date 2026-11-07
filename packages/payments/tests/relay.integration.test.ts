import {
  createPublicClient,
  custom,
  erc20Abi,
  keccak256,
  maxUint256,
  parseUnits,
  toHex,
  type Address,
} from "viem";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { paymentRouterAbi } from "../src/abi";
import { assertNever } from "../src/assert-never";
import { quote } from "../src/quote";
import { relayPayment, type RelayPaymentArgs } from "../src/relay";
import { tokens, type TokenSymbol } from "../src/tokens";
import {
  hashOrder,
  signIntent,
  signOrder,
  signUsdt0Permit,
  type Intent,
  type Order,
  type RouterDomain,
} from "../src/typed-data";
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
const RECEIVE_AMOUNT = parseUnits("15000", tokens.ARGt.decimals);

type Authorization = "permit" | "approve";

describe("relayPayment on an Arbitrum fork", () => {
  let fork: ArbitrumFork;
  let domain: RouterDomain;

  beforeAll(async () => {
    fork = await startArbitrumFork();
    domain = { chainId: arbitrum.id, router: fork.router };
    await fork.fundCustomer(
      tokens.USDT0.address,
      tokens.ARGt.pool,
      parseUnits("20", tokens.USDT0.decimals),
    );
    await fork.fundCustomer(
      tokens.BRAt.address,
      tokens.BRAt.pool,
      parseUnits("1000", tokens.BRAt.decimals),
    );
  });

  afterAll(() => {
    fork?.stop();
  });

  const balanceOf = (token: Address, owner: Address) =>
    fork.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [owner],
    });

  async function authorize(
    authorization: Authorization,
    payToken: TokenSymbol,
    maxPayAmount: bigint,
    deadline: bigint,
  ) {
    switch (authorization) {
      case "permit":
        return signUsdt0Permit(fork.walletFor(customer), fork.publicClient, {
          ...domain,
          value: maxPayAmount,
          deadline,
        });
      case "approve":
        await fork.publicClient.waitForTransactionReceipt({
          hash: await fork.walletFor(customer).writeContract({
            address: tokens[payToken].address,
            abi: erc20Abi,
            functionName: "approve",
            args: [domain.router, maxUint256],
          }),
        });
        return undefined;
      default:
        return assertNever(authorization);
    }
  }

  async function payAndAssert(
    payToken: TokenSymbol,
    orderLabel: string,
    authorization: Authorization,
  ) {
    const receiveToken = tokens.ARGt.address;
    const payTokenAddress = tokens[payToken].address;
    const quoted = await quote(fork.publicClient, {
      payToken,
      receiveToken: "ARGt",
      receiveAmount: RECEIVE_AMOUNT,
    });
    const { timestamp } = await fork.publicClient.getBlock();
    const order = {
      merchant: merchant.address,
      receiveToken,
      receiveAmount: RECEIVE_AMOUNT,
      orderId: keccak256(toHex(orderLabel)),
      expiry: timestamp + ORDER_TTL_SECONDS,
      feeBps: await fork.publicClient.readContract({
        address: domain.router,
        abi: paymentRouterAbi,
        functionName: "feeBps",
      }),
    };
    const intent = {
      payer: customer.address,
      payToken: payTokenAddress,
      maxPayAmount: quoted.maxPayAmount,
      orderHash: hashOrder(domain, order),
    };
    const permit = await authorize(
      authorization,
      payToken,
      quoted.maxPayAmount,
      timestamp + ORDER_TTL_SECONDS,
    );
    const payerBefore = await balanceOf(payTokenAddress, customer.address);
    const merchantBefore = await balanceOf(receiveToken, merchant.address);

    const relayed = await relayPayment(fork.walletFor(owner), fork.publicClient, {
      router: domain.router,
      order,
      merchantSignature: await signOrder(fork.walletFor(merchantSigner), domain, order),
      intent,
      payerSignature: await signIntent(fork.walletFor(customer), domain, intent),
      permit,
    });
    if (relayed.kind !== "settled") throw new Error(`Expected settled, got ${relayed.kind}`);
    const { settled } = relayed;

    const fee = (RECEIVE_AMOUNT * BigInt(FEE_BPS)) / 10_000n;
    expect(settled.fee).toBe(fee);
    expect((await balanceOf(receiveToken, merchant.address)) - merchantBefore).toBe(
      RECEIVE_AMOUNT - fee,
    );
    expect(payerBefore - (await balanceOf(payTokenAddress, customer.address))).toBe(
      settled.payAmount,
    );
    expect(settled.payAmount).toBeLessThanOrEqual(quoted.maxPayAmount);
    expect(settled.payAmount).toBe(quoted.payAmount);
    return quoted;
  }

  it("settles USDT0 -> ARGt with a permit and no prior approval", async () => {
    const allowance = await fork.publicClient.readContract({
      address: tokens.USDT0.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [customer.address, domain.router],
    });
    expect(allowance).toBe(0n);
    const quoted = await payAndAssert("USDT0", "usdt0-to-argt", "permit");
    expect(quoted.route.kind).toBe("single");
  });

  it("settles BRAt -> ARGt in two hops after a one-time approve", async () => {
    const quoted = await payAndAssert("BRAt", "brat-to-argt", "approve");
    expect(quoted.route.kind).toBe("double");
  });

  async function relayWithoutSending(args: RelayPaymentArgs) {
    const relayerNonce = () => fork.publicClient.getTransactionCount({ address: owner.address });
    const nonceBefore = await relayerNonce();
    const relayed = await relayPayment(fork.walletFor(owner), fork.publicClient, args);
    expect(await relayerNonce()).toBe(nonceBefore);
    return relayed;
  }

  async function signedPayment(
    label: string,
    { expiry, payer = customer.address }: { expiry?: bigint; payer?: Address } = {},
  ): Promise<RelayPaymentArgs> {
    const { timestamp } = await fork.publicClient.getBlock();
    const order: Order = {
      merchant: merchant.address,
      receiveToken: tokens.USDT0.address,
      receiveAmount: parseUnits("1", tokens.USDT0.decimals),
      orderId: keccak256(toHex(label)),
      expiry: expiry ?? timestamp + ORDER_TTL_SECONDS,
      feeBps: FEE_BPS,
    };
    const intent: Intent = {
      payer,
      payToken: tokens.USDT0.address,
      maxPayAmount: order.receiveAmount,
      orderHash: hashOrder(domain, order),
    };
    return {
      router: domain.router,
      order,
      merchantSignature: await signOrder(fork.walletFor(merchantSigner), domain, order),
      intent,
      payerSignature: await signIntent(fork.walletFor(customer), domain, intent),
    };
  }

  it("rejects a self-payment without sending a tx", async () => {
    const args = await signedPayment("self-payment", { payer: merchant.address });
    expect(await relayWithoutSending(args)).toEqual({
      kind: "invalid-order",
      reason: "self-payment",
    });
  });

  it("rejects an expired order without sending a tx", async () => {
    const { timestamp } = await fork.publicClient.getBlock();
    const args = await signedPayment("expired", { expiry: timestamp - 1n });
    expect(await relayWithoutSending(args)).toEqual({ kind: "invalid-order", reason: "expired" });
  });

  it("surfaces the router's revert error without sending a tx", async () => {
    const args = await signedPayment("bad-payer-signature");
    const forged = await signIntent(fork.walletFor(owner), domain, args.intent);
    expect(await relayWithoutSending({ ...args, payerSignature: forged })).toEqual({
      kind: "reverted",
      errorName: "InvalidPayerSignature",
    });
  });

  it("rethrows an RPC internal error during simulation instead of reporting a revert", async () => {
    const args = await signedPayment("rpc-internal-error");
    // Fails only the simulated `pay` (an eth_call to the router); verifyOrder's multicall still reaches anvil.
    const flakyClient = createPublicClient({
      chain: arbitrum,
      transport: custom(
        {
          request: async (request: { method: string; params?: unknown }) => {
            const call: unknown = Array.isArray(request.params) ? request.params[0] : undefined;
            const toRouter =
              typeof call === "object" &&
              call !== null &&
              "to" in call &&
              typeof call.to === "string" &&
              call.to.toLowerCase() === domain.router.toLowerCase();
            if (request.method === "eth_call" && toRouter)
              throw Object.assign(new Error("header not found"), { code: -32603 });
            return fork.publicClient.transport.request(request);
          },
        },
        { retryCount: 0 },
      ),
    });
    const nonceBefore = await fork.publicClient.getTransactionCount({ address: owner.address });
    await expect(relayPayment(fork.walletFor(owner), flakyClient, args)).rejects.toThrow(
      "header not found",
    );
    expect(await fork.publicClient.getTransactionCount({ address: owner.address })).toBe(
      nonceBefore,
    );
  });
});
