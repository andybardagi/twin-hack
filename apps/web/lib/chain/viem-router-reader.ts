import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { assertNever } from "@workspace/payments/assert-never";

import { getChainConfig } from "@/lib/chain/chain-config";
import type { RouterReader } from "@/lib/chain/router-reader";

type RouterReaderResult =
  | { status: "not-configured" }
  | { status: "configured"; reader: RouterReader };

export function getRouterReader(): RouterReaderResult {
  const config = getChainConfig();
  switch (config.status) {
    case "not-configured":
      return config;
    case "configured": {
      const client = createPublicClient({ chain: arbitrum, transport: http(config.rpcUrl) });
      const contract = { address: config.routerAddress, abi: paymentRouterAbi };
      return {
        status: "configured",
        reader: {
          signingKeyOf: (merchant) =>
            client.readContract({ ...contract, functionName: "signingKeyOf", args: [merchant] }),
          feeBps: () => client.readContract({ ...contract, functionName: "feeBps" }),
          paid: (merchant, orderId) =>
            client.readContract({ ...contract, functionName: "paid", args: [merchant, orderId] }),
        },
      };
    }
    default:
      return assertNever(config);
  }
}
