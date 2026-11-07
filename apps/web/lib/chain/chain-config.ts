import { getAddress, isAddress, zeroAddress, type Address } from "viem";
import { z } from "zod";

type ChainConfig =
  | { status: "not-configured" }
  | { status: "configured"; routerAddress: Address; rpcUrl: string };

export function getChainConfig(): ChainConfig {
  const routerAddress = process.env.PAYMENT_ROUTER_ADDRESS;
  const rpcUrl = process.env.ARBITRUM_RPC_URL;
  if (!routerAddress || !rpcUrl) return { status: "not-configured" };
  if (!isAddress(routerAddress) || getAddress(routerAddress) === zeroAddress) {
    throw new Error("Set PAYMENT_ROUTER_ADDRESS to a valid nonzero contract address.");
  }
  if (!z.url({ protocol: /^https?$/ }).safeParse(rpcUrl).success) {
    throw new Error("Set ARBITRUM_RPC_URL to a valid HTTP RPC URL.");
  }
  return { status: "configured", routerAddress: getAddress(routerAddress), rpcUrl };
}
