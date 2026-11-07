import { erc20Abi, keccak256, maxUint256, parseUnits, toHex, type Address } from "viem";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { paymentRouterAbi } from "../src/abi";
import { assertNever } from "../src/assert-never";
import { submitPayment } from "../src/pay";
import { quote } from "../src/quote";
import { tokens, type TokenSymbol } from "../src/tokens";
import {
  hashOrder,
  signIntent,
  signOrder,
  signUsdt0Permit,
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

describe("PaymentRouter SDK on an Arbitrum fork", () => {
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

    const { settled } = await submitPayment(fork.walletFor(owner), fork.publicClient, {
      router: domain.router,
      order,
      merchantSignature: await signOrder(fork.walletFor(merchantSigner), domain, order),
      intent,
      payerSignature: await signIntent(fork.walletFor(customer), domain, intent),
      permit,
    });

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
});
