import { assertNever } from "@workspace/payments/assert-never";

import { OrderAmount } from "@/components/orders/order-amount";
import type { PayOrder } from "@/lib/orders/pay-order";

export function PayOrderStatus({
  order,
  retryHref,
}: {
  order: Exclude<PayOrder, { status: "not-found" }>;
  retryHref: string;
}) {
  switch (order.status) {
    case "valid":
      return (
        <>
          <OrderAmount {...order.display} />
          <p className="text-sm text-muted-foreground">
            Verified: signed by the merchant’s registered device.
          </p>
        </>
      );
    case "paid":
      return (
        <>
          <OrderAmount {...order.display} />
          <p role="status">This order has been paid.</p>
        </>
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
