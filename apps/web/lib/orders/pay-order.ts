import { isHex, type Address, type Hex } from "viem";
import { arbitrum } from "viem/chains";

import { hashOrder } from "@workspace/payments/typed-data";

import { readRouter, type RouterSource } from "@/lib/chain/read-router";
import type { OrderRepository } from "@/lib/orders/order-repository";
import { isSignedByMerchantKey } from "@/lib/orders/order-signature";
import { toReservedOrder } from "@/lib/orders/reserved-order";
import { formatOrderDisplay } from "@/src/helpers/order-display";
import { toSignableOrder } from "@/src/helpers/order-schema";

/** What the public pay page may show. Never add the merchant address: this reaches the browser. */
export type PayOrder =
  | { status: "not-found" }
  | { status: "unverified" }
  | { status: "invalid" }
  | { status: "expired" | "paid"; display: OrderDisplay }
  | { status: "valid"; display: OrderDisplay; payment: PaymentTerms };

type OrderDisplay = ReturnType<typeof formatOrderDisplay>;

/** What the payer signs against: the order hash commits to the merchant without revealing it. */
export type PaymentTerms = {
  router: Address;
  orderHash: Hex;
  receiveToken: Address;
  receiveAmount: string;
  expiry: number;
};

export async function verifyPayOrder(
  id: string,
  repository: OrderRepository,
  routerSource: RouterSource,
): Promise<PayOrder> {
  const order = await repository.findById(id);
  if (!order?.signature) return { status: "not-found" };
  const { signature } = order;

  const signed = toSignableOrder(toReservedOrder(order));
  const chain = await readRouter(routerSource, async (router) => {
    const [paid, signedByKey] = await Promise.all([
      router.reader.paid(signed.merchant, signed.orderId),
      isHex(signature) ? isSignedByMerchantKey(router, signed, signature) : false,
    ]);
    return { paid, signedByKey };
  });
  if (chain === null) return { status: "unverified" };

  const display = formatOrderDisplay(order.amount, order.tokenAddress);
  // Payment is final on chain, so it stands even if the merchant later rotates the key.
  if (chain.paid) return { status: "paid", display };
  if (!chain.signedByKey) return { status: "invalid" };
  if (order.expiresAt <= new Date()) return { status: "expired", display };
  const router = routerSource().routerAddress;
  return {
    status: "valid",
    display,
    payment: {
      router,
      orderHash: hashOrder({ chainId: arbitrum.id, router }, signed),
      receiveToken: signed.receiveToken,
      receiveAmount: signed.receiveAmount.toString(),
      expiry: Number(signed.expiry),
    },
  };
}
