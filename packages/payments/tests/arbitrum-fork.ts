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
  toHex,
  type Address,
  type Chain,
  type PublicClient,
  type TestClient,
  type Transport,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";

import { paymentRouterAbi } from "../src/abi";
import { tokens } from "../src/tokens";

const RPC_URL = process.env.ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
export const FEE_BPS = 50;

const contractsDir = new URL("../../../contracts/", import.meta.url).pathname;
const artifactPath = `${contractsDir}out/PaymentRouter.sol/PaymentRouter.json`;

// Anvil's default accounts carry EIP-7702 delegations on Arbitrum, which break USDT0 permits, so use fresh keys.
const testAccount = (label: string) =>
  privateKeyToAccount(keccak256(toHex(`payments-test-${label}`)));
export const owner = testAccount("owner");
export const merchant = testAccount("merchant");
export const merchantSigner = testAccount("merchant-signer");
export const customer = testAccount("customer");

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

async function waitForRpc(publicClient: PublicClient, anvil: ChildProcess, stderr: () => string) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (anvil.exitCode !== null)
      throw new Error(`anvil exited with code ${anvil.exitCode}: ${stderr()}`);
    const ready = await publicClient.getChainId().then(
      () => true,
      () => false,
    );
    if (ready) return;
    await sleep(500);
  }
  throw new Error("anvil did not start in time");
}

export type ArbitrumFork = {
  publicClient: PublicClient<Transport, Chain>;
  testClient: TestClient<"anvil", Transport, Chain>;
  walletFor: (account: PrivateKeyAccount) => WalletClient<Transport, Chain, PrivateKeyAccount>;
  router: Address;
  /** Moves `amount` of `token` from `holder` (e.g. a Curve pool) to `customer` by impersonating it. */
  fundCustomer: (token: Address, holder: Address, amount: bigint) => Promise<void>;
  stop: () => void;
};

/**
 * Spawns anvil on an Arbitrum fork, funds the test accounts with ETH, deploys a PaymentRouter
 * owned by `owner`, and registers `merchantSigner` as `merchant`'s signing key. Call `stop` when done.
 */
export async function startArbitrumFork(): Promise<ArbitrumFork> {
  const port = await freePort();
  // Forks the latest block unless FORK_BLOCK is set (needs an archive RPC for older blocks).
  const forkBlock = process.env.FORK_BLOCK;
  const anvil = spawn("anvil", [
    "--fork-url",
    RPC_URL,
    ...(forkBlock ? ["--fork-block-number", forkBlock] : []),
    "--port",
    String(port),
    // Skips fetching the dev accounts' fork state; the public RPC rate-limits back-to-back forks.
    "--accounts",
    "0",
    "--silent",
  ]);
  let stderr = "";
  anvil.stderr.on("data", (chunk) => (stderr += chunk));
  const stop = () => anvil.kill();
  try {
    const transport = http(`http://127.0.0.1:${port}`);
    const publicClient = createPublicClient({ chain: arbitrum, transport });
    await waitForRpc(publicClient, anvil, () => stderr);
    const testClient = createTestClient({ chain: arbitrum, mode: "anvil", transport });
    const walletFor = (account: PrivateKeyAccount) =>
      createWalletClient({ account, chain: arbitrum, transport });

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
    const { contractAddress: router } = await publicClient.waitForTransactionReceipt({
      hash: deployHash,
    });
    if (!router) throw new Error("Router deployment returned no address");

    await publicClient.waitForTransactionReceipt({
      hash: await walletFor(merchant).writeContract({
        address: router,
        abi: paymentRouterAbi,
        functionName: "setSigningKey",
        args: [merchantSigner.address],
      }),
    });

    const fundCustomer = async (token: Address, holder: Address, amount: bigint) => {
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

    return { publicClient, testClient, walletFor, router, fundCustomer, stop };
  } catch (error) {
    stop();
    throw error;
  }
}
