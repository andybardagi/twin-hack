import { getAddress, isAddress, zeroAddress } from "viem";
import { z } from "zod";

export const DEFAULT_PAYMENT_ROUTER_ADDRESS = "0x4DE32c75eecDF3229114F105293698284b261Bb1";
export const DEFAULT_ARBITRUM_RPC_URL = "https://arb1.arbitrum.io/rpc";

/** The deployed Arbitrum router and public RPC, unless PAYMENT_ROUTER_ADDRESS or ARBITRUM_RPC_URL override them. */
export function getChainConfig() {
  const routerAddress = process.env.PAYMENT_ROUTER_ADDRESS || DEFAULT_PAYMENT_ROUTER_ADDRESS;
  const rpcUrl = process.env.ARBITRUM_RPC_URL || DEFAULT_ARBITRUM_RPC_URL;
  if (!isAddress(routerAddress) || getAddress(routerAddress) === zeroAddress) {
    throw new Error("Set PAYMENT_ROUTER_ADDRESS to a valid nonzero contract address.");
  }
  if (!z.url({ protocol: /^https?$/ }).safeParse(rpcUrl).success) {
    throw new Error("Set ARBITRUM_RPC_URL to a valid HTTP RPC URL.");
  }
  return { routerAddress: getAddress(routerAddress), rpcUrl };
}
