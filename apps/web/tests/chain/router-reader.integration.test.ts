import type { ChildProcess } from "node:child_process";
import {
  createTestClient,
  createWalletClient,
  erc20Abi,
  keccak256,
  parseEther,
  parseUnits,
  toHex,
  type PublicClient,
  type Transport,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { submitPayment } from "@workspace/payments/pay";
import { tokens } from "@workspace/payments/tokens";
import {
  hashOrder,
  signIntent,
  signOrder,
  type RouterDomain,
} from "@workspace/payments/typed-data";

import type { RouterReader } from "@/lib/chain/router-reader";
import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { orderIdToBytes32 } from "@/src/helpers/order-id";

import { startRouterFork } from "./fork-harness";

const FEE_BPS = 50;

// Fresh keys avoid EIP-7702 delegations on Anvil's default accounts on Arbitrum.
const testAccount = (label: string) =>
  privateKeyToAccount(keccak256(toHex(`payments-test-${label}`)));
const owner = testAccount("owner");
const merchant = testAccount("merchant");
const merchantSigner = testAccount("merchant-signer");
const customer = testAccount("customer");

describe("RouterReader on an Arbitrum fork", () => {
  let anvil: ChildProcess;
  let publicClient: PublicClient;
  let domain: RouterDomain;
  let transport: Transport;
  let reader: RouterReader;
  const walletFor = (account: PrivateKeyAccount) =>
    createWalletClient({ account, chain: arbitrum, transport });

  beforeAll(async () => {
    const fork = await startRouterFork(owner, [owner, merchant, customer]);
    ({ anvil, publicClient, transport, domain } = fork);
    await publicClient.waitForTransactionReceipt({
      hash: await walletFor(merchant).writeContract({
        address: domain.router,
        abi: paymentRouterAbi,
        functionName: "setSigningKey",
        args: [merchantSigner.address],
      }),
    });

    vi.stubEnv("PAYMENT_ROUTER_ADDRESS", domain.router);
    vi.stubEnv("ARBITRUM_RPC_URL", fork.rpcUrl);
    reader = getRouterReader().reader;
  });

  afterAll(() => {
    anvil?.kill();
    vi.unstubAllEnvs();
  });

  it("reads signing keys, fees, and settlement before and after a real payment", async () => {
    expect(await reader.signingKeyOf(merchant.address)).toBe(merchantSigner.address);
    expect(await reader.signingKeyOf(customer.address)).toBe(
      "0x0000000000000000000000000000000000000000",
    );
    expect(await reader.feeBps()).toBe(FEE_BPS);
    const orderId = orderIdToBytes32("019a56a0-1234-7000-8000-123456789abc");
    expect(await reader.paid(merchant.address, orderId)).toBe(false);

    const testClient = createTestClient({ chain: arbitrum, mode: "anvil", transport });
    const holder = tokens.ARGt.pool;
    await testClient.impersonateAccount({ address: holder });
    await testClient.setBalance({ address: holder, value: parseEther("1") });
    const receiveAmount = parseUnits("1", tokens.USDT0.decimals);
    await publicClient.waitForTransactionReceipt({
      hash: await createWalletClient({ account: holder, chain: arbitrum, transport }).writeContract(
        {
          address: tokens.USDT0.address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [customer.address, receiveAmount],
        },
      ),
    });
    await testClient.stopImpersonatingAccount({ address: holder });
    await publicClient.waitForTransactionReceipt({
      hash: await walletFor(customer).writeContract({
        address: tokens.USDT0.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [domain.router, receiveAmount],
      }),
    });
    const { timestamp } = await publicClient.getBlock();
    const order = {
      merchant: merchant.address,
      receiveToken: tokens.USDT0.address,
      receiveAmount,
      orderId,
      expiry: timestamp + 900n,
      feeBps: FEE_BPS,
    };
    const intent = {
      payer: customer.address,
      payToken: tokens.USDT0.address,
      maxPayAmount: receiveAmount,
      orderHash: hashOrder(domain, order),
    };
    await submitPayment(walletFor(owner), publicClient, {
      router: domain.router,
      order,
      merchantSignature: await signOrder(walletFor(merchantSigner), domain, order),
      intent,
      payerSignature: await signIntent(walletFor(customer), domain, intent),
    });
    expect(await reader.paid(merchant.address, orderId)).toBe(true);
    expect(await reader.paid(customer.address, orderId)).toBe(false);
  });
});
