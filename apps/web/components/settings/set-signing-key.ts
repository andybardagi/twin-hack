import { BaseError, UserRejectedRequestError, isAddressEqual, type Address } from "viem";
import { arbitrum } from "viem/chains";
import type { Config, Connector } from "wagmi";
import {
  connect,
  getConnection,
  switchChain,
  writeContract,
  waitForTransactionReceipt,
} from "wagmi/actions";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { assertNever } from "@workspace/payments/assert-never";

export async function setSigningKey(
  config: Config,
  connector: Connector,
  merchant: Address,
  router: Address,
  signingKey: Address,
): Promise<void> {
  const connection = getConnection(config);
  const accounts =
    connection.connector?.uid === connector.uid && connection.address
      ? [connection.address]
      : (await connect(config, { connector })).accounts;
  if (!isAddressEqual(accounts[0], merchant))
    throw new Error("Connect the wallet you used to sign in, then try again.");
  if (getConnection(config).chainId !== arbitrum.id)
    await switchChain(config, { connector, chainId: arbitrum.id });
  const hash = await writeContract(config, {
    connector,
    account: merchant,
    chainId: arbitrum.id,
    address: router,
    abi: paymentRouterAbi,
    functionName: "setSigningKey",
    args: [signingKey],
  });
  const receipt = await waitForTransactionReceipt(config, { chainId: arbitrum.id, hash });
  switch (receipt.status) {
    case "success":
      return;
    case "reverted":
      throw new Error("Transaction reverted. Check your wallet and try again.");
    default:
      return assertNever(receipt.status);
  }
}

export function signingKeyErrorMessage(error: unknown): string {
  const cause =
    error instanceof BaseError
      ? error.walk((cause) => cause instanceof UserRejectedRequestError)
      : error;
  if (
    cause instanceof UserRejectedRequestError ||
    (typeof cause === "object" && cause !== null && "code" in cause && cause.code === 4001)
  )
    return "Transaction canceled. Try again when you’re ready.";
  if (
    error instanceof Error &&
    [
      "Connect the wallet you used to sign in, then try again.",
      "Transaction reverted. Check your wallet and try again.",
    ].includes(error.message)
  )
    return error.message;
  return "Couldn’t update the signing key. Unlock your signed-in wallet, select Arbitrum, check your ETH balance and browser storage, then try again.";
}
