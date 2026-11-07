import { BaseError, UserRejectedRequestError } from "viem";
import { arbitrum } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import type { Config, Connector } from "wagmi";
import { connect, disconnect, signMessage } from "wagmi/actions";

import { authClient } from "@/lib/auth-client";

class SignInError extends Error {}

export async function signInWallet(
  config: Config,
  connector: Connector,
  location: Pick<Location, "host" | "origin">,
): Promise<void> {
  const cachedConnection = config.state.connections.get(connector.uid);
  if (!cachedConnection && config.state.current === connector.uid) {
    await disconnect(config, { connector });
  }
  const connection = cachedConnection ?? (await connect(config, { connector }));
  const { data: nonce, error: nonceError } = await authClient.siwe.nonce();
  if (nonceError || !nonce) {
    throw new SignInError("Couldn’t start sign-in. Check your connection and try again.");
  }

  const message = createSiweMessage({
    address: connection.accounts[0],
    chainId: arbitrum.id,
    domain: location.host,
    uri: location.origin,
    version: "1",
    nonce: nonce.nonce,
  });
  const signature = await signMessage(config, {
    connector,
    account: connection.accounts[0],
    message,
  });
  const { data, error } = await authClient.siwe.verify({ message, signature });
  if (error || !data?.success) {
    throw new SignInError("Couldn’t verify your sign-in. Check your connection and try again.");
  }
}

export function getSignInMessage(error: unknown): string {
  const cause =
    error instanceof BaseError
      ? error.walk((cause) => cause instanceof UserRejectedRequestError)
      : error;
  if (
    cause instanceof UserRejectedRequestError ||
    (typeof cause === "object" && cause !== null && "code" in cause && cause.code === 4001)
  ) {
    return "Sign-in canceled. Choose your wallet when you’re ready to try again.";
  }
  if (error instanceof SignInError) return error.message;
  return "Couldn’t complete sign-in. Check your connection, unlock your wallet, and try again.";
}
