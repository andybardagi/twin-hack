import { UserRejectedRequestError } from "viem";
import { expect, it } from "vitest";
import { arbitrum, mainnet } from "viem/chains";
import { createConfig, http } from "wagmi";
import { mock } from "wagmi/connectors";
import {
  payoutAddressErrorMessage,
  setSigningKey,
  signingKeyErrorMessage,
} from "@/components/settings/set-signing-key";
it("gives actionable messages without exposing provider error details", () => {
  expect(
    signingKeyErrorMessage(new UserRejectedRequestError(new Error("private provider data"))),
  ).toContain("canceled");
  expect(signingKeyErrorMessage({ code: 4001 })).toContain("canceled");
  expect(signingKeyErrorMessage(new Error("private provider data"))).not.toContain(
    "private provider data",
  );
  expect(
    signingKeyErrorMessage(new Error("Transaction reverted. Check your wallet and try again.")),
  ).toContain("reverted");
});

it("names the forward address in its fallback and keeps shared wallet messages", () => {
  expect(payoutAddressErrorMessage(new Error("private provider data"))).toContain(
    "forward address",
  );
  expect(payoutAddressErrorMessage({ code: 4001 })).toContain("canceled");
});

const merchant = "0x1234567890123456789012345678901234567890";
const other = "0x2222222222222222222222222222222222222222";
it("rejects a connected wallet that differs from the signed-in merchant before sending", async () => {
  const config = createConfig({
    chains: [arbitrum],
    connectors: [mock({ accounts: [other] })],
    transports: { [arbitrum.id]: http() },
  });
  const connector = config.connectors[0];
  if (!connector) throw new Error("Missing test connector");
  await expect(setSigningKey(config, connector, merchant, other, other)).rejects.toThrow(
    "Connect the wallet you used to sign in",
  );
});
it("handles a rejected Arbitrum switch without sending a transaction", async () => {
  const config = createConfig({
    chains: [mainnet, arbitrum],
    connectors: [mock({ accounts: [merchant], features: { switchChainError: true } })],
    transports: { [mainnet.id]: http(), [arbitrum.id]: http() },
  });
  const connector = config.connectors[0];
  if (!connector) throw new Error("Missing test connector");
  const error = await setSigningKey(config, connector, merchant, other, other).catch(
    (error: unknown) => error,
  );
  expect(signingKeyErrorMessage(error)).toContain("canceled");
});
