import {
  hashTypedData,
  parseAbi,
  parseSignature,
  type Account,
  type Address,
  type Chain,
  type ContractFunctionArgs,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";

import { paymentRouterAbi } from "./abi";
import { tokens } from "./tokens";

type PayArgs = ContractFunctionArgs<typeof paymentRouterAbi, "nonpayable", "pay">;
export type Order = PayArgs[0];
export type Intent = PayArgs[2];
export type PermitData = PayArgs[4];

export type RouterDomain = { chainId: number; router: Address };
type Signer = WalletClient<Transport, Chain | undefined, Account>;

const paymentRouterTypes = {
  Order: [
    { name: "merchant", type: "address" },
    { name: "receiveToken", type: "address" },
    { name: "receiveAmount", type: "uint256" },
    { name: "orderId", type: "bytes32" },
    { name: "expiry", type: "uint64" },
    { name: "feeBps", type: "uint16" },
  ],
  Intent: [
    { name: "payer", type: "address" },
    { name: "payToken", type: "address" },
    { name: "maxPayAmount", type: "uint256" },
    { name: "orderHash", type: "bytes32" },
  ],
} as const;

const permitTypes = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const noncesAbi = parseAbi(["function nonces(address owner) view returns (uint256)"]);

/** A zero-value permit tells `pay` to rely on an existing allowance. */
export const noPermit: PermitData = {
  value: 0n,
  deadline: 0n,
  v: 0,
  r: `0x${"00".repeat(32)}`,
  s: `0x${"00".repeat(32)}`,
};

function paymentRouterDomain({ chainId, router }: RouterDomain) {
  return { name: "PaymentRouter", version: "1", chainId, verifyingContract: router } as const;
}

/** The full EIP-712 digest, matching `PaymentRouter.hashOrder`; this is what `Intent.orderHash` commits to. */
export function hashOrder(domain: RouterDomain, order: Order): Hex {
  return hashTypedData({
    domain: paymentRouterDomain(domain),
    types: paymentRouterTypes,
    primaryType: "Order",
    message: order,
  });
}

export function signOrder(signer: Signer, domain: RouterDomain, order: Order): Promise<Hex> {
  return signer.signTypedData({
    account: signer.account,
    domain: paymentRouterDomain(domain),
    types: paymentRouterTypes,
    primaryType: "Order",
    message: order,
  });
}

export function signIntent(signer: Signer, domain: RouterDomain, intent: Intent): Promise<Hex> {
  return signer.signTypedData({
    account: signer.account,
    domain: paymentRouterDomain(domain),
    types: paymentRouterTypes,
    primaryType: "Intent",
    message: intent,
  });
}

/** Signs an EIP-2612 permit letting the router pull `value` USDT0 from the signer. */
export async function signUsdt0Permit(
  signer: Signer,
  publicClient: PublicClient,
  { chainId, router, value, deadline }: RouterDomain & { value: bigint; deadline: bigint },
): Promise<PermitData> {
  const owner = signer.account.address;
  const nonce = await publicClient.readContract({
    address: tokens.USDT0.address,
    abi: noncesAbi,
    functionName: "nonces",
    args: [owner],
  });
  const signature = await signer.signTypedData({
    account: signer.account,
    // USDT0 has no eip712Domain(); this matches its on-chain DOMAIN_SEPARATOR.
    domain: { name: "USD₮0", version: "1", chainId, verifyingContract: tokens.USDT0.address },
    types: permitTypes,
    primaryType: "Permit",
    message: { owner, spender: router, value, nonce, deadline },
  });
  const { r, s, yParity } = parseSignature(signature);
  return { value, deadline, v: yParity + 27, r, s };
}
