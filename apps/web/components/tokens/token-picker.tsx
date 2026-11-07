"use client";

import { useState } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { cn } from "@workspace/ui/lib/utils";

import type { Token } from "@/src/helpers/tokens";

export function TokenIcon({ token, className }: { token: Token; className?: string }) {
  // Low priority keeps React from emitting a preload <link> for every coin in server HTML.
  return (
    <img
      src={token.icon}
      alt=""
      fetchPriority="low"
      className={cn("size-6 shrink-0 rounded-full", className)}
    />
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground">
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** A token chosen from a bottom sheet. `chip` sits over an amount; `field` fills a form row. */
export function TokenPicker({
  tokens,
  value,
  onChange,
  title,
  description,
  variant,
  disabled = false,
}: {
  tokens: Token[];
  value: Token | undefined;
  onChange: (token: Token) => void;
  title: string;
  description?: string;
  variant: "chip" | "field";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        disabled={disabled}
        aria-label={`${title}: ${value ? `${value.symbol}, ${value.name}` : "none chosen"}`}
        className={cn(
          "flex items-center border border-border text-left transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-50",
          variant === "chip"
            ? "gap-2 rounded-full bg-card py-1 pr-3 pl-1 text-sm"
            : "w-full gap-3 rounded-xl bg-background px-3 py-2.5",
        )}
      >
        {value ? (
          <>
            <TokenIcon token={value} className={variant === "field" ? "size-8" : undefined} />
            {variant === "chip" ? (
              <>
                <span className="font-mono font-medium">{value.symbol}</span>
                <span className="text-muted-foreground">{value.name}</span>
              </>
            ) : (
              <span className="grid min-w-0 flex-1">
                <span className="font-mono text-sm font-medium">{value.symbol}</span>
                <span className="text-xs text-muted-foreground">{value.name}</span>
              </span>
            )}
          </>
        ) : (
          <span className={cn("text-muted-foreground", variant === "chip" ? "pl-2" : "flex-1")}>
            Choose a token
          </span>
        )}
        <Chevron />
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <ul className="grid gap-0.5 overflow-y-auto p-2 pb-6">
            {tokens.map((token) => {
              const selected = token.address === value?.address;
              return (
                <li key={token.address}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-muted",
                      selected && "bg-secondary hover:bg-secondary",
                    )}
                    onClick={() => {
                      onChange(token);
                      setOpen(false);
                    }}
                  >
                    <TokenIcon token={token} className="size-8" />
                    <span className="grid min-w-0 flex-1">
                      <span className="font-mono text-sm font-medium">{token.symbol}</span>
                      <span className="text-xs text-muted-foreground">{token.name}</span>
                    </span>
                    {selected && (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4.5 text-primary">
                        <path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
