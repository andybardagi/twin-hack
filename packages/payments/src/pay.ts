import {
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
import { noPermit, type Intent, type Order, type PermitData } from "./typed-data";

type PaymentSettled = DecodeEventLogReturnType<typeof paymentRouterAbi, "PaymentSettled">["args"];

export type SubmitPaymentArgs = {
  router: Address;
  order: Order;
  merchantSignature: Hex;
  intent: Intent;
  payerSignature: Hex;
  permit?: PermitData;
};

/** Submits `pay` and resolves once mined; throws if the tx reverted or emitted no `PaymentSettled`. */
export async function submitPayment(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient,
  {
    router,
    order,
    merchantSignature,
    intent,
    payerSignature,
    permit = noPermit,
  }: SubmitPaymentArgs,
): Promise<{ hash: Hex; settled: PaymentSettled }> {
  const hash = await walletClient.writeContract({
    address: router,
    abi: paymentRouterAbi,
    functionName: "pay",
    args: [order, merchantSignature, intent, payerSignature, permit],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`Payment tx ${hash} reverted`);
  const [settledLog] = parseEventLogs({
    abi: paymentRouterAbi,
    eventName: "PaymentSettled",
    logs: receipt.logs.filter((log) => isAddressEqual(log.address, router)),
  });
  if (!settledLog) throw new Error(`Payment tx ${hash} emitted no PaymentSettled`);
  return { hash, settled: settledLog.args };
}
