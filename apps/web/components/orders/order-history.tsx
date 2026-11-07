"use client";

import { useState, type ReactNode } from "react";
import { useIsClient } from "usehooks-ts";

import { assertNever } from "@workspace/payments/assert-never";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { cn } from "@workspace/ui/lib/utils";

import { TokenIcon } from "@/components/tokens/token-picker";
import type { OrderHistoryItem } from "@/lib/orders/order-history";
import type { OrderStatus } from "@/src/helpers/order-schema";
import { tokens } from "@/src/helpers/tokens";

const ARBISCAN_URL = "https://arbiscan.io";

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "open":
      return "Waiting";
    case "expired":
      return "Expired";
    default:
      return assertNever(status);
  }
}

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
        status === "paid" && "bg-primary text-primary-foreground",
        status === "open" && "bg-secondary text-secondary-foreground",
        status === "expired" && "bg-muted text-muted-foreground",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function OrderTokenIcon({ order, className }: { order: OrderHistoryItem; className?: string }) {
  const token = tokens.find(
    (candidate) => candidate.address.toLowerCase() === order.tokenAddress.toLowerCase(),
  );
  return token ? (
    <TokenIcon token={token} className={className} />
  ) : (
    <span aria-hidden="true" className={cn("shrink-0 rounded-full bg-muted", className)} />
  );
}

/** Dates render on the client only, so they use the viewer's locale and time zone. */
function OrderDate({ iso }: { iso: string }) {
  const isClient = useIsClient();
  return (
    <time dateTime={iso} className="min-h-4">
      {isClient &&
        new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}

function shortHex(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono font-medium underline-offset-4 hover:underline"
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-3.5 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function OrderDetails({ order }: { order: OrderHistoryItem }) {
  const notRecorded = <span className="text-muted-foreground">Not recorded</span>;
  return (
    <div className="mx-auto w-full max-w-md overflow-y-auto pb-6">
      <DrawerHeader className="items-center gap-3 pt-6 text-center">
        <OrderTokenIcon order={order} className="size-12" />
        <div className="grid gap-1">
          <DrawerTitle className="font-heading text-3xl font-medium tracking-tight tabular-nums">
            {order.amount} <span className="font-mono text-lg">{order.symbol}</span>
          </DrawerTitle>
          <DrawerDescription>
            <OrderDate iso={order.createdAt} />
          </DrawerDescription>
        </div>
        <StatusChip status={order.status} />
      </DrawerHeader>
      <dl className="mx-4 mt-5 divide-y divide-border rounded-2xl border border-border bg-card px-4">
        <DetailRow label="Amount">
          <span className="font-medium tabular-nums">
            {order.amount} <span className="font-mono">{order.symbol}</span>
          </span>
        </DetailRow>
        <DetailRow label={`Commission (${order.feeBps / 100}%)`}>
          <span className="font-medium tabular-nums">
            {order.commission} <span className="font-mono">{order.symbol}</span>
          </span>
        </DetailRow>
        <DetailRow label="Payer">
          {order.payerAddress ? (
            <ExternalLink href={`${ARBISCAN_URL}/address/${order.payerAddress}`}>
              {shortHex(order.payerAddress)}
            </ExternalLink>
          ) : order.status === "paid" ? (
            notRecorded
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailRow>
        <DetailRow label="Transaction">
          {order.txHash ? (
            <ExternalLink href={`${ARBISCAN_URL}/tx/${order.txHash}`}>
              {shortHex(order.txHash)}
            </ExternalLink>
          ) : order.status === "paid" ? (
            notRecorded
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailRow>
      </dl>
    </div>
  );
}

export function OrderHistory({ orders }: { orders: OrderHistoryItem[] }) {
  const [open, setOpen] = useState(false);
  // Kept after closing so the sheet keeps its content while it animates out.
  const [selected, setSelected] = useState<OrderHistoryItem | null>(null);

  if (orders.length === 0)
    return (
      <div className="m-auto grid max-w-xs justify-items-center gap-1.5 px-8 text-center">
        <p className="font-medium">No orders yet</p>
        <p className="text-sm text-balance text-muted-foreground">
          Orders you charge from the keypad show up here.
        </p>
      </div>
    );

  return (
    <>
      <ul className="mx-3.5 mt-2 mb-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {orders.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted"
              onClick={() => {
                setSelected(order);
                setOpen(true);
              }}
            >
              <OrderTokenIcon order={order} className="size-9" />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate font-medium tabular-nums">
                  {order.amount} <span className="font-mono text-sm">{order.symbol}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  <OrderDate iso={order.createdAt} />
                </span>
              </span>
              <StatusChip status={order.status} />
            </button>
          </li>
        ))}
      </ul>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>{selected && <OrderDetails order={selected} />}</DrawerContent>
      </Drawer>
    </>
  );
}
