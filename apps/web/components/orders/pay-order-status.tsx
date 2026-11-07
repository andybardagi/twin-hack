import type { ReactNode } from "react";

import { assertNever } from "@workspace/payments/assert-never";

import { OrderAmount } from "@/components/orders/order-amount";
import { PaymentConfirmed } from "@/components/orders/payment-confirmed";
import type { PayOrder } from "@/lib/orders/pay-order";

export function PayOrderStatus({
  order,
  retryHref,
  payment,
}: {
  order: Exclude<PayOrder, { status: "not-found" }>;
  retryHref: string;
  /** Rendered under a valid order: how the customer pays it. */
  payment?: ReactNode;
}) {
  switch (order.status) {
    case "valid":
      return (
        <>
          <OrderAmount {...order.display} />
          <p className="text-sm text-muted-foreground">
            Verified: signed by the merchant’s registered device.
          </p>
          {payment}
        </>
      );
    case "paid":
      return (
        <PaymentConfirmed title="Order paid">
          <OrderAmount {...order.display} />
        </PaymentConfirmed>
      );
    case "expired":
      return (
        <>
          <OrderAmount {...order.display} />
          <p role="status">This order has expired. Ask the merchant for a new one.</p>
        </>
      );
    case "invalid":
      return (
        <p role="alert" className="text-destructive">
          This order isn’t signed by the merchant’s registered device. Don’t pay it.
        </p>
      );
    case "unverified":
      return (
        <div className="space-y-2">
          <p role="alert">Couldn’t verify this order right now.</p>
          <a href={retryHref} className="text-sm font-medium underline underline-offset-4">
            Try again
          </a>
        </div>
      );
    default:
      return assertNever(order);
  }
}
