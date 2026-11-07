import {
  isAddressEqual,
  recoverAddress,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";

import { paymentRouterAbi } from "./abi";
import { hashOrder, type Order, type RouterDomain } from "./typed-data";

type InvalidOrderReason =
  | "no-signing-key"
  | "wrong-signer"
  | "fee-changed"
  | "expired"
  | "already-paid"
  | "unsupported-token"
  | "self-payment";

export type OrderVerification = { kind: "valid" } | { kind: "invalid"; reason: InvalidOrderReason };

async function recoverOrderSigner(domain: RouterDomain, order: Order, signature: Hex) {
  const hash = hashOrder(domain, order);
  try {
    return await recoverAddress({ hash, signature });
  } catch {
    // Only the signature can fail here, and viem throws plain Errors (bad length, v, r/s) with no type to match.
    return undefined;
  }
}

/**
 * Checks `order` against the router at the latest block, as `pay` would, plus the off-chain no-self-payment rule.
 * When several checks fail, the reason follows `PaymentRouter._verify`'s order (signature, fee, expiry, paid,
 * token) so it matches the revert `pay` would hit; self-payment comes last. `publicClient` needs a chain with multicall3.
 */
export async function verifyOrder(
  publicClient: PublicClient,
  {
    router,
    order,
    merchantSignature,
    payer,
  }: { router: Address; order: Order; merchantSignature: Hex; payer: Address },
): Promise<OrderVerification> {
  const { chain } = publicClient;
  if (!chain) throw new Error("verifyOrder needs a publicClient configured with a chain");
  const routerContract = { address: router, abi: paymentRouterAbi } as const;
  const [[signingKey, feeBps, paid, payout, usdt0, receivePool], { timestamp }] = await Promise.all(
    [
      publicClient.multicall({
        allowFailure: false,
        contracts: [
          { ...routerContract, functionName: "signingKeyOf", args: [order.merchant] },
          { ...routerContract, functionName: "feeBps" },
          { ...routerContract, functionName: "paid", args: [order.merchant, order.orderId] },
          { ...routerContract, functionName: "payoutAddressOf", args: [order.merchant] },
          { ...routerContract, functionName: "usdt0" },
          { ...routerContract, functionName: "poolOf", args: [order.receiveToken] },
        ],
      }),
      publicClient.getBlock(),
    ],
  );
  const invalid = (reason: InvalidOrderReason): OrderVerification => ({ kind: "invalid", reason });

  if (isAddressEqual(signingKey, zeroAddress)) return invalid("no-signing-key");
  const signer = await recoverOrderSigner({ chainId: chain.id, router }, order, merchantSignature);
  if (!signer || !isAddressEqual(signer, signingKey)) return invalid("wrong-signer");
  if (order.feeBps !== feeBps) return invalid("fee-changed");
  if (timestamp > order.expiry) return invalid("expired");
  if (paid) return invalid("already-paid");
  if (!isAddressEqual(order.receiveToken, usdt0) && isAddressEqual(receivePool, zeroAddress))
    return invalid("unsupported-token");
  if (
    isAddressEqual(payer, order.merchant) ||
    (!isAddressEqual(payout, zeroAddress) && isAddressEqual(payer, payout))
  )
    return invalid("self-payment");
  return { kind: "valid" };
}
