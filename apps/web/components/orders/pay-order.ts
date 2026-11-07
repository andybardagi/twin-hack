import {
  BaseError,
  UserRejectedRequestError,
  erc20Abi,
  formatEther,
  isAddressEqual,
  type Address,
  type Hex,
} from "viem";
import { arbitrum } from "viem/chains";
import type { Config, Connector } from "wagmi";
import {
  connect,
  getConnection,
  getPublicClient,
  getWalletClient,
  readContract,
  switchChain,
} from "wagmi/actions";

import { approveTwin, twinApprovalStatus } from "@workspace/payments/approval";
import { assertNever } from "@workspace/payments/assert-never";
import { quote } from "@workspace/payments/quote";
import { isTokenSymbol, tokens, type TokenSymbol } from "@workspace/payments/tokens";
import { signIntent, signUsdt0Permit, type PermitData } from "@workspace/payments/typed-data";

import { apiClient } from "@/lib/api-client";
import type { PaymentTerms } from "@/lib/orders/pay-order";
import { payOrderResultSchema } from "@/src/helpers/pay-order-schema";

export type PayStep = "connect" | "quote" | "permit" | "approve" | "sign" | "send";

class PayOrderError extends Error {}

/** The payments SDK symbol for a token address, if the router settles it. */
export function paymentTokenSymbol(address: Address): TokenSymbol | undefined {
  return Object.keys(tokens)
    .filter(isTokenSymbol)
    .find((symbol) => isAddressEqual(tokens[symbol].address, address));
}

function arbitrumPublicClient(config: Config) {
  const client = getPublicClient(config, { chainId: arbitrum.id });
  if (!client) throw new PayOrderError("Arbitrum isn’t available in this wallet setup.");
  return client;
}

export function quotePayment(
  config: Config,
  { payToken, terms }: { payToken: TokenSymbol; terms: PaymentTerms },
) {
  const receiveToken = paymentTokenSymbol(terms.receiveToken);
  if (!receiveToken) throw new PayOrderError("This order’s token isn’t supported.");
  return quote(arbitrumPublicClient(config), {
    payToken,
    receiveToken,
    receiveAmount: BigInt(terms.receiveAmount),
  });
}

/**
 * Pays the order from `payer`'s wallet: re-quotes, authorizes the router to pull the pay token (USDT0 permit or
 * the one-time Twin approve), signs the intent, and asks the server to relay it. Resolves with the payment tx hash.
 */
export async function payOrder(
  config: Config,
  connector: Connector,
  {
    orderId,
    payer,
    payToken,
    terms,
  }: { orderId: string; payer: Address; payToken: TokenSymbol; terms: PaymentTerms },
  onStep: (step: PayStep) => void,
): Promise<Hex> {
  onStep("connect");
  const connection = getConnection(config);
  const accounts =
    connection.connector?.uid === connector.uid && connection.address
      ? [connection.address]
      : (await connect(config, { connector })).accounts;
  if (!isAddressEqual(accounts[0], payer))
    throw new PayOrderError("Connect the wallet you signed in with, then try again.");
  if (getConnection(config).chainId !== arbitrum.id)
    await switchChain(config, { connector, chainId: arbitrum.id });
  const walletClient = await getWalletClient(config, {
    connector,
    account: payer,
    chainId: arbitrum.id,
  });
  const publicClient = arbitrumPublicClient(config);
  const domain = { chainId: arbitrum.id, router: terms.router };
  const pay = tokens[payToken];

  onStep("quote");
  const { maxPayAmount } = await quotePayment(config, { payToken, terms });
  const balance = await readContract(config, {
    chainId: arbitrum.id,
    address: pay.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [payer],
  });
  if (balance < maxPayAmount)
    throw new PayOrderError(`Not enough ${payTokenLabel(payToken)} in your wallet for this order.`);

  let permit: PermitData | undefined;
  switch (pay.kind) {
    case "usdt0":
      onStep("permit");
      permit = await signUsdt0Permit(walletClient, publicClient, {
        ...domain,
        value: maxPayAmount,
        deadline: BigInt(terms.expiry),
      });
      break;
    case "twin": {
      const approval = await twinApprovalStatus(publicClient, {
        payer,
        token: pay,
        router: terms.router,
        maxPayAmount,
      });
      switch (approval.kind) {
        case "approved":
          break;
        case "needs-approval":
          onStep("approve");
          await approveTwin(walletClient, publicClient, { token: pay, router: terms.router });
          break;
        case "insufficient-eth":
          throw new PayOrderError(
            `The one-time ${payToken} approval needs about ${formatEther(approval.gasCost)} ETH on Arbitrum for gas. Add ETH, then try again.`,
          );
        default:
          assertNever(approval);
      }
      break;
    }
    default:
      assertNever(pay);
  }

  onStep("sign");
  const intent = { payer, payToken: pay.address, maxPayAmount, orderHash: terms.orderHash };
  const payerSignature = await signIntent(walletClient, domain, intent);

  onStep("send");
  const { data, error } = await apiClient.api.orders({ id: orderId }).pay.post({
    payToken: pay.address,
    maxPayAmount: maxPayAmount.toString(),
    payerSignature,
    permit: permit && {
      ...permit,
      value: permit.value.toString(),
      deadline: permit.deadline.toString(),
    },
  });
  if (error) {
    const value: unknown = error.value;
    throw new PayOrderError(
      typeof value === "object" && value !== null && "message" in value
        ? String(value.message)
        : "Couldn’t send the payment. Nothing was charged. Try again.",
    );
  }
  return payOrderResultSchema.parse(data).hash;
}

export function payTokenLabel(symbol: TokenSymbol): string {
  return symbol === "USDT0" ? "USDT" : symbol;
}

export function payOrderErrorMessage(error: unknown): string {
  const cause =
    error instanceof BaseError
      ? error.walk((cause) => cause instanceof UserRejectedRequestError)
      : error;
  if (
    cause instanceof UserRejectedRequestError ||
    (typeof cause === "object" && cause !== null && "code" in cause && cause.code === 4001)
  )
    return "Payment canceled. Nothing was charged. Try again when you’re ready.";
  if (error instanceof PayOrderError) return error.message;
  return "Couldn’t complete the payment. Unlock your wallet, select Arbitrum, then try again.";
}
