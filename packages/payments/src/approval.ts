import {
  erc20Abi,
  maxUint256,
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";

import type { TwinToken } from "./tokens";

export type TwinApprovalStatus =
  | { kind: "approved" }
  | { kind: "needs-approval"; gasCost: bigint }
  | { kind: "insufficient-eth"; gasCost: bigint; ethBalance: bigint };

// Headroom for Arbitrum's L1 data fee and fee drift between estimate and send.
const GAS_COST_BUFFER_PERCENT = 120n;

/** Whether `payer` still needs the one-time approve for `router`, and whether they can afford its gas. */
export async function twinApprovalStatus(
  publicClient: PublicClient,
  {
    payer,
    token,
    router,
    maxPayAmount,
  }: { payer: Address; token: TwinToken; router: Address; maxPayAmount: bigint },
): Promise<TwinApprovalStatus> {
  const allowance = await publicClient.readContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [payer, router],
  });
  if (allowance >= maxPayAmount) return { kind: "approved" };

  const [gas, { maxFeePerGas }, ethBalance] = await Promise.all([
    publicClient.estimateContractGas({
      address: token.address,
      abi: erc20Abi,
      functionName: "approve",
      args: [router, maxUint256],
      account: payer,
    }),
    publicClient.estimateFeesPerGas(),
    publicClient.getBalance({ address: payer }),
  ]);
  const gasCost = (gas * maxFeePerGas * GAS_COST_BUFFER_PERCENT) / 100n;
  return ethBalance < gasCost
    ? { kind: "insufficient-eth", gasCost, ethBalance }
    : { kind: "needs-approval", gasCost };
}

/** Sends the one-time unlimited approve of `token` to `router`; throws if the tx reverted. */
export async function approveTwin(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient,
  { token, router }: { token: TwinToken; router: Address },
): Promise<Hex> {
  const hash = await walletClient.writeContract({
    address: token.address,
    abi: erc20Abi,
    functionName: "approve",
    args: [router, maxUint256],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Approve tx ${hash} reverted`);
  return hash;
}
