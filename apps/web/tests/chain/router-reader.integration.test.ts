import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  erc20Abi,
  http,
  isHex,
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
import { assertNever } from "@workspace/payments/assert-never";
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

const RPC_URL = process.env.ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
const FEE_BPS = 50;

const contractsDir = new URL("../../../../contracts/", import.meta.url).pathname;
const artifactPath = `${contractsDir}out/PaymentRouter.sol/PaymentRouter.json`;

// Fresh keys avoid EIP-7702 delegations on Anvil's default accounts on Arbitrum.
const testAccount = (label: string) =>
  privateKeyToAccount(keccak256(toHex(`payments-test-${label}`)));
const owner = testAccount("owner");
const merchant = testAccount("merchant");
const merchantSigner = testAccount("merchant-signer");
const customer = testAccount("customer");

function readRouterBytecode() {
  if (!existsSync(artifactPath))
    execFileSync("forge", ["build"], { cwd: contractsDir, stdio: "inherit" });
  const artifact: unknown = JSON.parse(readFileSync(artifactPath, "utf8"));
  if (
    typeof artifact !== "object" ||
    artifact === null ||
    !("bytecode" in artifact) ||
    typeof artifact.bytecode !== "object" ||
    artifact.bytecode === null ||
    !("object" in artifact.bytecode) ||
    !isHex(artifact.bytecode.object)
  ) {
    throw new Error(`No bytecode in ${artifactPath}`);
  }
  return artifact.bytecode.object;
}

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address === null || typeof address === "string")
        return reject(new Error("No TCP port assigned"));
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForRpc(publicClient: PublicClient, anvil: ChildProcess) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (anvil.exitCode !== null) throw new Error(`anvil exited with code ${anvil.exitCode}`);
    const ready = await publicClient.getChainId().then(
      () => true,
      () => false,
    );
    if (ready) return;
    await sleep(500);
  }
  throw new Error("anvil did not start in time");
}

describe("RouterReader on an Arbitrum fork", () => {
  let anvil: ChildProcess;
  let publicClient: PublicClient;
  let domain: RouterDomain;
  let transport: Transport;
  let reader: RouterReader;
  const walletFor = (account: PrivateKeyAccount) =>
    createWalletClient({ account, chain: arbitrum, transport });

  beforeAll(async () => {
    const port = await freePort();
    // Forks the latest block unless FORK_BLOCK is set (needs an archive RPC for older blocks).
    const forkBlock = process.env.FORK_BLOCK;
    anvil = spawn("anvil", [
      "--fork-url",
      RPC_URL,
      ...(forkBlock ? ["--fork-block-number", forkBlock] : []),
      "--port",
      String(port),
      "--silent",
      "--no-storage-caching",
    ]);
    transport = http(`http://127.0.0.1:${port}`);
    publicClient = createPublicClient({ chain: arbitrum, transport });
    await waitForRpc(publicClient, anvil);

    const testClient = createTestClient({ chain: arbitrum, mode: "anvil", transport });
    for (const account of [owner, merchant, customer]) {
      await testClient.setBalance({ address: account.address, value: parseEther("1") });
    }
    const twinTokens = Object.values(tokens).flatMap((token) => {
      switch (token.kind) {
        case "twin":
          return [token];
        case "usdt0":
          return [];
        default:
          return assertNever(token);
      }
    });
    const deployHash = await walletFor(owner).deployContract({
      abi: paymentRouterAbi,
      bytecode: readRouterBytecode(),
      args: [
        owner.address,
        owner.address,
        FEE_BPS,
        tokens.USDT0.address,
        twinTokens.map((token) => token.address),
        twinTokens.map((token) => token.pool),
      ],
    });
    const { contractAddress } = await publicClient.waitForTransactionReceipt({ hash: deployHash });
    if (!contractAddress) throw new Error("Router deployment returned no address");
    domain = { chainId: arbitrum.id, router: contractAddress };

    await publicClient.waitForTransactionReceipt({
      hash: await walletFor(merchant).writeContract({
        address: contractAddress,
        abi: paymentRouterAbi,
        functionName: "setSigningKey",
        args: [merchantSigner.address],
      }),
    });

    vi.stubEnv("PAYMENT_ROUTER_ADDRESS", contractAddress);
    vi.stubEnv("ARBITRUM_RPC_URL", `http://127.0.0.1:${port}`);
    const result = getRouterReader();
    switch (result.status) {
      case "configured":
        reader = result.reader;
        break;
      case "not-configured":
        throw new Error("Test router is not configured");
      default:
        assertNever(result);
    }
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
