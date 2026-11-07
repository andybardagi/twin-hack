import { keccak256, toHex, zeroAddress, createTestClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createConfig } from "wagmi";
import { mock } from "wagmi/connectors";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

import { setSigningKey } from "@/components/settings/set-signing-key";
import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { startRouterFork } from "./fork-harness";

const merchant = privateKeyToAccount(keccak256(toHex("signing-key-test-merchant")));
const signer = privateKeyToAccount(keccak256(toHex("signing-key-test-device")));
let fork: Awaited<ReturnType<typeof startRouterFork>>;
beforeAll(async () => {
  fork = await startRouterFork(merchant, [merchant]);
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", fork.domain.router);
  vi.stubEnv("ARBITRUM_RPC_URL", fork.rpcUrl);
});
afterAll(() => {
  fork?.anvil.kill();
  vi.unstubAllEnvs();
});
it("registers, rotates and revokes a key read through RouterReader", async () => {
  const { reader } = getRouterReader();
  const chain = { ...arbitrum, rpcUrls: { default: { http: [fork.rpcUrl] } } };
  const config = createConfig({
    chains: [chain],
    connectors: [mock({ accounts: [merchant.address] })],
    transports: { [arbitrum.id]: fork.transport },
  });
  const connector = config.connectors[0];
  if (!connector) throw new Error("Missing test connector");
  const testClient = createTestClient({ chain, mode: "anvil", transport: fork.transport });
  await testClient.impersonateAccount({ address: merchant.address });
  expect(await reader.signingKeyOf(merchant.address)).toBe(zeroAddress);
  for (const key of [signer.address, merchant.address, zeroAddress]) {
    await setSigningKey(config, connector, merchant.address, fork.domain.router, key);
    expect(await reader.signingKeyOf(merchant.address)).toBe(key);
  }
  await testClient.stopImpersonatingAccount({ address: merchant.address });
});
