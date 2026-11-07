"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { assertNever } from "@workspace/payments/assert-never";
import { Button } from "@workspace/ui/components/button";

import { OrderQrCode } from "@/components/orders/order-qr-code";
import {
  orderStatusPollInterval,
  OrderStatusError,
  readOrderStatus,
} from "@/components/orders/order-status";

export function OrderSettlement({ id, payUrl }: { id: string; payUrl: string }) {
  const order = useQuery({
    queryKey: ["order-status", id],
    queryFn: () => readOrderStatus(id),
    // A failed poll waits for the merchant's retry instead of polling on.
    refetchInterval: (query) =>
      query.state.status === "error" ? false : orderStatusPollInterval(query.state.data),
  });

  const status = order.data;
  switch (status) {
    case "paid":
      return (
        <p role="status" className="text-lg font-medium">
          Payment received.
        </p>
      );
    case "expired":
      return (
        <div role="status" className="space-y-2">
          <p>This order expired before it was paid.</p>
          <Link className="text-sm underline" href="/orders/new">
            Create a new order
          </Link>
        </div>
      );
    case undefined:
    case "open":
      return (
        <>
          <OrderQrCode url={payUrl} />
          <p className="text-sm text-muted-foreground">Scan the QR code to view this order.</p>
          {order.isError ? (
            <div role="alert" className="space-y-2">
              {order.error instanceof OrderStatusError && order.error.status === 401 ? (
                <>
                  <p>Your session expired. Sign in again to check this payment.</p>
                  <Link className="text-sm underline" href="/sign-in">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  <p>Couldn’t check the payment status. Check your connection, then try again.</p>
                  <Button onClick={() => void order.refetch()}>Try again</Button>
                </>
              )}
            </div>
          ) : (
            <p role="status">{order.isPending ? "Checking payment…" : "Waiting for payment…"}</p>
          )}
        </>
      );
    default:
      return assertNever(status);
  }
}
