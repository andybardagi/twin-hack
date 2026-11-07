import { createPublicClient, http } from "viem";
import { arbitrum } from "viem/chains";

import { paymentRouterAbi } from "@workspace/payments/abi";

import { getChainConfig } from "@/lib/chain/chain-config";
import type { Router } from "@/lib/chain/router-reader";

export function getRouterReader(): Router {
  const { routerAddress, rpcUrl } = getChainConfig();
  const client = createPublicClient({ chain: arbitrum, transport: http(rpcUrl) });
  const contract = { address: routerAddress, abi: paymentRouterAbi };
  return {
    routerAddress,
    reader: {
      signingKeyOf: (merchant) =>
        client.readContract({ ...contract, functionName: "signingKeyOf", args: [merchant] }),
      feeBps: () => client.readContract({ ...contract, functionName: "feeBps" }),
      paid: (merchant, orderId) =>
        client.readContract({ ...contract, functionName: "paid", args: [merchant, orderId] }),
    },
  };
}
