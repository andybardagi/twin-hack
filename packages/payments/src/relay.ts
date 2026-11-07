import {
  BaseError,
  ContractFunctionRevertedError,
  ExecutionRevertedError,
  isAddressEqual,
  parseEventLogs,
  type Account,
  type Address,
  type Chain,
  type DecodeEventLogReturnType,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
} from "viem";

import { paymentRouterAbi } from "./abi";
import { assertNever } from "./assert-never";
import { noPermit, type Intent, type Order, type PermitData } from "./typed-data";
import { verifyOrder, type InvalidOrderReason } from "./verify-order";

type PaymentSettled = DecodeEventLogReturnType<typeof paymentRouterAbi, "PaymentSettled">["args"];

export type RelayPaymentArgs = {
  router: Address;
  order: Order;
  merchantSignature: Hex;
  intent: Intent;
  payerSignature: Hex;
  permit?: PermitData;
};

export type RelayPaymentResult =
  | { kind: "settled"; hash: Hex; settled: PaymentSettled }
  | { kind: "invalid-order"; reason: InvalidOrderReason }
  | { kind: "reverted"; errorName: string };

function revertedErrorName(error: unknown) {
  // viem also builds a ContractFunctionRevertedError for RPC internal errors (-32603); only a node revert counts.
  if (
    !(error instanceof BaseError) ||
    !error.walk((cause) => cause instanceof ExecutionRevertedError)
  )
    return undefined;
  const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
  if (!(reverted instanceof ContractFunctionRevertedError)) return undefined;
  return reverted.data?.errorName ?? reverted.reason ?? "unknown";
}

/**
 * Verifies the order and simulates `pay` before sending it from `walletClient`, so a payment that would revert
 * costs the relayer no gas. Throws on RPC failures, or if the mined tx reverted or emitted no `PaymentSettled`.
 */
export async function relayPayment(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  { router, order, merchantSignature, intent, payerSignature, permit = noPermit }: RelayPaymentArgs,
): Promise<RelayPaymentResult> {
  const verification = await verifyOrder(publicClient, {
    router,
    order,
    merchantSignature,
    payer: intent.payer,
  });
  switch (verification.kind) {
    case "valid":
      break;
    case "invalid":
      return { kind: "invalid-order", reason: verification.reason };
    default:
      return assertNever(verification);
  }

  let request;
  try {
    ({ request } = await publicClient.simulateContract({
      account: walletClient.account,
      address: router,
      abi: paymentRouterAbi,
      functionName: "pay",
      args: [order, merchantSignature, intent, payerSignature, permit],
    }));
  } catch (error) {
    const errorName = revertedErrorName(error);
    if (errorName === undefined) throw error;
    return { kind: "reverted", errorName };
  }

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Payment tx ${hash} reverted`);
  const [settledLog] = parseEventLogs({
    abi: paymentRouterAbi,
    eventName: "PaymentSettled",
    logs: receipt.logs.filter((log) => isAddressEqual(log.address, router)),
  });
  if (!settledLog) throw new Error(`Payment tx ${hash} emitted no PaymentSettled`);
  return { kind: "settled", hash, settled: settledLog.args };
}
