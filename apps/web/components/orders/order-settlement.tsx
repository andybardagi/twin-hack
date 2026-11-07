"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useCopyToClipboard, useInterval } from "usehooks-ts";

import { assertNever } from "@workspace/payments/assert-never";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import { PageHeader } from "@/components/app-shell/page-header";
import { OrderAmount } from "@/components/orders/order-amount";
import { OrderQrCode } from "@/components/orders/order-qr-code";
import {
  orderStatusPollInterval,
  OrderStatusError,
  readOrderStatus,
} from "@/components/orders/order-status";
import { PaymentConfirmed } from "@/components/orders/payment-confirmed";
import type { formatOrderDisplay } from "@/src/helpers/order-display";

function StatusPill({
  tone,
  children,
}: {
  tone: "waiting" | "error" | "off";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
        tone === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          tone === "waiting" && "bg-primary motion-safe:animate-pulse",
          tone === "error" && "bg-destructive",
          tone === "off" && "bg-muted-foreground",
        )}
      />
      {children}
    </span>
  );
}

function useSecondsLeft(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const COPIED_FEEDBACK_MS = 2000;

function CopyLinkButton({ url }: { url: string }) {
  const [, copy] = useCopyToClipboard();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copied = state === "copied";

  return (
    <div className="grid justify-items-center gap-1">
      <Button
        variant="outline"
        className={cn("rounded-full transition-colors", copied && "border-primary text-primary")}
        onClick={async () => {
          setState((await copy(url)) ? "copied" : "failed");
          setTimeout(() => setState("idle"), COPIED_FEEDBACK_MS);
        }}
      >
        <svg
          key={state}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4 motion-safe:animate-in motion-safe:duration-200 motion-safe:zoom-in-50"
          fill="none"
          stroke="currentColor"
          strokeWidth={copied ? 2.4 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {copied ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          ) : (
            <>
              <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
              <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
            </>
          )}
        </svg>
        {copied ? "Link copied" : "Copy payment link"}
      </Button>
      <p aria-live="polite" className="min-h-4 text-xs text-destructive">
        {state === "failed" && "Couldn’t copy the link. Try again."}
      </p>
    </div>
  );
}

function Screen({ body, actions }: { body: ReactNode; actions: ReactNode }) {
  return (
    <>
      <PageHeader title="Order" />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-4 text-center">
        {body}
      </div>
      <div className="grid gap-2 px-4 pt-3 pb-6">{actions}</div>
    </>
  );
}

const actionClass = "h-13 w-full rounded-2xl text-base";

export function OrderSettlement({
  id,
  payUrl,
  expiresAt,
  display,
  chargeAgainHref,
}: {
  id: string;
  payUrl: string;
  /** ISO timestamp the signed order stops being payable. */
  expiresAt: string;
  display: ReturnType<typeof formatOrderDisplay>;
  chargeAgainHref: string;
}) {
  const order = useQuery({
    queryKey: ["order-status", id],
    queryFn: () => readOrderStatus(id),
    // A failed poll waits for the merchant's retry instead of polling on.
    refetchInterval: (query) =>
      query.state.status === "error" ? false : orderStatusPollInterval(query.state.data),
  });
  const secondsLeft = useSecondsLeft(expiresAt);
  const newOrder = (
    <Button size="lg" className={actionClass} render={<Link href="/" />}>
      New order
    </Button>
  );

  const status = order.data;
  switch (status) {
    case "paid":
      return (
        <Screen
          body={
            <PaymentConfirmed title="Payment received">
              <OrderAmount {...display} />
            </PaymentConfirmed>
          }
          actions={newOrder}
        />
      );
    case "expired":
      return (
        <Screen
          body={
            <>
              <OrderAmount {...display} />
              <div className="relative">
                <div aria-hidden="true" className="opacity-20 blur-[1.5px] grayscale">
                  <OrderQrCode url={payUrl} />
                </div>
                <span className="absolute inset-0 m-auto h-fit w-fit rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold">
                  Expired
                </span>
              </div>
              <div role="status" className="grid justify-items-center gap-2">
                <StatusPill tone="off">Order expired</StatusPill>
                <p className="max-w-[30ch] text-sm text-balance text-muted-foreground">
                  Nobody paid in time. Charge again to show a new code.
                </p>
              </div>
            </>
          }
          actions={
            <>
              <Button size="lg" className={actionClass} render={<Link href={chargeAgainHref} />}>
                Charge again
              </Button>
              <Button variant="ghost" size="lg" className={actionClass} render={<Link href="/" />}>
                New order
              </Button>
            </>
          }
        />
      );
    case undefined:
    case "open": {
      const sessionExpired = order.error instanceof OrderStatusError && order.error.status === 401;
      function statusLine() {
        if (order.isError)
          return sessionExpired ? (
            <div role="alert" className="grid justify-items-center gap-2">
              <StatusPill tone="error">Session expired</StatusPill>
              <p className="max-w-[30ch] text-sm text-balance text-muted-foreground">
                Sign in again to keep checking this payment.
              </p>
            </div>
          ) : (
            <div role="alert" className="grid justify-items-center gap-2">
              <StatusPill tone="error">Can’t check payment status</StatusPill>
              <p className="max-w-[30ch] text-sm text-balance text-muted-foreground">
                The code still works. Check your connection, then try again.
              </p>
            </div>
          );
        if (order.isPending)
          return (
            <div role="status" className="grid justify-items-center gap-2">
              <StatusPill tone="waiting">Checking payment…</StatusPill>
              <p className="text-sm text-muted-foreground">Show this code to your customer.</p>
            </div>
          );
        return (
          <div role="status" className="grid justify-items-center gap-2">
            <StatusPill tone="waiting">
              Waiting for payment ·{" "}
              <span className="font-mono tabular-nums" aria-label="Time left">
                {formatCountdown(secondsLeft)}
              </span>
            </StatusPill>
            <p className="max-w-[30ch] text-sm text-balance text-muted-foreground">
              Your customer scans this code and pays from their wallet.
            </p>
          </div>
        );
      }
      return (
        <Screen
          body={
            <>
              <OrderAmount {...display} />
              <div className="grid justify-items-center gap-3">
                <OrderQrCode url={payUrl} />
                <CopyLinkButton url={payUrl} />
              </div>
              {statusLine()}
            </>
          }
          actions={
            order.isError ? (
              sessionExpired ? (
                <Button size="lg" className={actionClass} render={<Link href="/sign-in" />}>
                  Sign in
                </Button>
              ) : (
                <Button size="lg" className={actionClass} onClick={() => void order.refetch()}>
                  Try again
                </Button>
              )
            ) : (
              <Button variant="ghost" size="lg" className={actionClass} render={<Link href="/" />}>
                Back to keypad
              </Button>
            )
          }
        />
      );
    }
    default:
      return assertNever(status);
  }
}
