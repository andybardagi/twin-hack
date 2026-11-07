import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  http,
  isHex,
  parseEther,
  type PublicClient,
  type Transport,
} from "viem";
import type { PrivateKeyAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { paymentRouterAbi } from "@workspace/payments/abi";
import { assertNever } from "@workspace/payments/assert-never";
import { tokens } from "@workspace/payments/tokens";
import type { RouterDomain } from "@workspace/payments/typed-data";
const RPC_URL = process.env.ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";
const FEE_BPS = 50;

const contractsDir = new URL("../../../../contracts/", import.meta.url).pathname;
const artifactPath = `${contractsDir}out/PaymentRouter.sol/PaymentRouter.json`;

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

export async function startRouterFork(
  owner: PrivateKeyAccount,
  accounts: PrivateKeyAccount[],
): Promise<{
  anvil: ChildProcess;
  publicClient: PublicClient;
  transport: Transport;
  domain: RouterDomain;
  rpcUrl: string;
}> {
  const port = await freePort();
  // Forks the latest block unless FORK_BLOCK is set (needs an archive RPC for older blocks).
  const forkBlock = process.env.FORK_BLOCK;
  const anvil = spawn("anvil", [
    "--fork-url",
    RPC_URL,
    ...(forkBlock ? ["--fork-block-number", forkBlock] : []),
    "--port",
    String(port),
    "--silent",
    "--no-storage-caching",
  ]);
  try {
    const transport = http(`http://127.0.0.1:${port}`);
    const publicClient = createPublicClient({ chain: arbitrum, transport });
    await waitForRpc(publicClient, anvil);

    const testClient = createTestClient({ chain: arbitrum, mode: "anvil", transport });
    for (const account of accounts) {
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
    const deployHash = await createWalletClient({
      account: owner,
      chain: arbitrum,
      transport,
    }).deployContract({
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
    return {
      anvil,
      publicClient,
      transport,
      domain: { chainId: arbitrum.id, router: contractAddress },
      rpcUrl: `http://127.0.0.1:${port}`,
    };
  } catch (error) {
    anvil.kill();
    throw error;
  }
}
