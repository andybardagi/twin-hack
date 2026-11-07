import { createTestClient, keccak256, toHex, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { createConfig } from "wagmi";
import { mock } from "wagmi/connectors";
import { afterAll, beforeAll, expect, it } from "vitest";

import { paymentRouterAbi } from "@workspace/payments/abi";

import { setPayoutAddress } from "@/components/settings/set-signing-key";
import { startRouterFork } from "./fork-harness";

const merchant = privateKeyToAccount(keccak256(toHex("payout-address-test-merchant")));
const forwardAddress = privateKeyToAccount(keccak256(toHex("payout-address-test-forward"))).address;
let fork: Awaited<ReturnType<typeof startRouterFork>>;
beforeAll(async () => {
  fork = await startRouterFork(merchant, [merchant]);
});
afterAll(() => {
  fork?.anvil.kill();
});

it("sets and clears the payout address, and the contract rejects the router", async () => {
  const { router } = fork.domain;
  const chain = { ...arbitrum, rpcUrls: { default: { http: [fork.rpcUrl] } } };
  const config = createConfig({
    chains: [chain],
    connectors: [mock({ accounts: [merchant.address] })],
    transports: { [arbitrum.id]: fork.transport },
  });
  const connector = config.connectors[0];
  if (!connector) throw new Error("Missing test connector");
  const readPayoutAddress = () =>
    fork.publicClient.readContract({
      address: router,
      abi: paymentRouterAbi,
      functionName: "payoutAddressOf",
      args: [merchant.address],
    });
  const testClient = createTestClient({ chain, mode: "anvil", transport: fork.transport });
  await testClient.impersonateAccount({ address: merchant.address });

  expect(await readPayoutAddress()).toBe(zeroAddress);
  await setPayoutAddress(config, connector, merchant.address, router, forwardAddress);
  expect(await readPayoutAddress()).toBe(forwardAddress);
  await expect(
    setPayoutAddress(config, connector, merchant.address, router, router),
  ).rejects.toThrow();
  expect(await readPayoutAddress()).toBe(forwardAddress);
  await setPayoutAddress(config, connector, merchant.address, router, zeroAddress);
  expect(await readPayoutAddress()).toBe(zeroAddress);

  await testClient.stopImpersonatingAccount({ address: merchant.address });
});
