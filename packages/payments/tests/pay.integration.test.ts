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
  maxUint256,
  parseEther,
  parseUnits,
  toHex,
  type Address,
  type PublicClient,
  type Transport,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
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

const FORK_BLOCK = 522_117_000n;
const RPC_URL = process.env.ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
const FEE_BPS = 50;
const ORDER_TTL_SECONDS = 600n;
const RECEIVE_AMOUNT = parseUnits("15000", tokens.ARGt.decimals);

type Authorization = "permit" | "approve";

const contractsDir = new URL("../../../contracts/", import.meta.url).pathname;
const artifactPath = `${contractsDir}out/PaymentRouter.sol/PaymentRouter.json`;

// Anvil's default accounts carry EIP-7702 delegations on Arbitrum, which break USDT0 permits, so use fresh keys.
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

describe("PaymentRouter SDK on an Arbitrum fork", () => {
  let anvil: ChildProcess;
  let publicClient: PublicClient;
  let domain: RouterDomain;
  let transport: Transport;
  const walletFor = (account: PrivateKeyAccount) =>
    createWalletClient({ account, chain: arbitrum, transport });

  beforeAll(async () => {
    const port = await freePort();
    anvil = spawn("anvil", [
      "--fork-url",
      RPC_URL,
      "--fork-block-number",
      FORK_BLOCK.toString(),
      "--port",
      String(port),
      "--silent",
    ]);
    transport = http(`http://127.0.0.1:${port}`);
    publicClient = createPublicClient({ chain: arbitrum, transport });
    await waitForRpc(publicClient, anvil);

    const testClient = createTestClient({ chain: arbitrum, mode: "anvil", transport });
    for (const account of [owner, merchant, customer]) {
      await testClient.setBalance({ address: account.address, value: parseEther("1") });
    }
    const twinTokens = Object.values(tokens).flatMap((token) =>
      token.kind === "twin" ? [token] : [],
    );
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

    const fund = async (token: Address, holder: Address, amount: bigint) => {
      await testClient.impersonateAccount({ address: holder });
      await testClient.setBalance({ address: holder, value: parseEther("1") });
      const hash = await createWalletClient({
        account: holder,
        chain: arbitrum,
        transport,
      }).writeContract({
        address: token,
        abi: erc20Abi,
        functionName: "transfer",
        args: [customer.address, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await testClient.stopImpersonatingAccount({ address: holder });
    };
    await fund(tokens.USDT0.address, tokens.ARGt.pool, parseUnits("20", tokens.USDT0.decimals));
    await fund(tokens.BRAt.address, tokens.BRAt.pool, parseUnits("1000", tokens.BRAt.decimals));
  });

  afterAll(() => {
    anvil?.kill();
  });

  const balanceOf = (token: Address, owner: Address) =>
    publicClient.readContract({
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
        return signUsdt0Permit(walletFor(customer), publicClient, {
          ...domain,
          value: maxPayAmount,
          deadline,
        });
      case "approve":
        await publicClient.waitForTransactionReceipt({
          hash: await walletFor(customer).writeContract({
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
    const quoted = await quote(publicClient, {
      payToken,
      receiveToken: "ARGt",
      receiveAmount: RECEIVE_AMOUNT,
    });
    const { timestamp } = await publicClient.getBlock();
    const order = {
      merchant: merchant.address,
      receiveToken,
      receiveAmount: RECEIVE_AMOUNT,
      orderId: keccak256(toHex(orderLabel)),
      expiry: timestamp + ORDER_TTL_SECONDS,
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

    const { settled } = await submitPayment(walletFor(owner), publicClient, {
      router: domain.router,
      order,
      merchantSignature: await signOrder(walletFor(merchantSigner), domain, order),
      intent,
      payerSignature: await signIntent(walletFor(customer), domain, intent),
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
    const allowance = await publicClient.readContract({
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
