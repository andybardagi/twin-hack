"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useEventListener } from "usehooks-ts";
import type { Hex } from "viem";

import { assertNever } from "@workspace/payments/assert-never";
import type { Order } from "@workspace/payments/typed-data";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import { createOrder, CreateOrderError } from "@/components/orders/create-order";
import { TokenPicker } from "@/components/tokens/token-picker";
import { DeviceKeyError } from "@/lib/signing-key/device-key";
import {
  fitDecimals,
  formatTypedAmount,
  pressKey,
  type KeypadKey,
  type KeypadResult,
} from "@/src/helpers/keypad";
import { findCollectableToken, tokens, type Token } from "@/src/helpers/tokens";

const collectableTokens = tokens.filter((token) => token.config.canCollect);
const digitKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const keyboardDigits: readonly KeypadKey[] = [...digitKeys, "0"];

function keyFromKeyboard(key: string): KeypadKey | undefined {
  const digit = keyboardDigits.find((digit) => digit === key);
  if (digit) return digit;
  if (key === "." || key === ",") return ".";
  if (key === "Backspace") return "delete";
  return undefined;
}

function rejectionMessage(
  reason: Extract<KeypadResult, { status: "rejected" }>["reason"],
  token: Token,
) {
  switch (reason) {
    case "decimals":
      return token.fiatDecimals === 0
        ? `${token.symbol} has no decimal places.`
        : `${token.symbol} allows ${token.fiatDecimals} decimal places.`;
    case "too-large":
      return "That amount is too large.";
    default:
      return assertNever(reason);
  }
}

function CreateOrderForm({
  defaultTokenAddress,
  initialTokenAddress,
  initialAmount,
  sign,
}: {
  defaultTokenAddress: string;
  /** Prefills the keypad, e.g. when charging an expired order again. */
  initialTokenAddress?: string;
  initialAmount?: string;
  sign: (order: Order) => Promise<Hex>;
}) {
  const router = useRouter();
  const defaultToken = findCollectableToken(defaultTokenAddress);
  const [token, setToken] = useState(
    () => (initialTokenAddress && findCollectableToken(initialTokenAddress)) || defaultToken,
  );
  const [amount, setAmount] = useState(() =>
    token && initialAmount ? fitDecimals(initialAmount, token.fiatDecimals) : "",
  );
  const [rejection, setRejection] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: ({ token, amount }: { token: Token; amount: string }) =>
      createOrder({ tokenAddress: token.address, amount }, sign),
    retry: false,
    onSuccess: ({ id }) => router.push(`/orders/${id}`),
    onError: (error) => {
      if (error instanceof CreateOrderError && error.status === 401) {
        router.replace("/sign-in");
      }
    },
  });
  const busy = mutation.isPending || mutation.isSuccess;
  const submittable = amount.replace(/\.$/, "");
  const canSubmit = token !== undefined && Number(submittable) > 0 && !busy;

  function press(key: KeypadKey) {
    if (busy) return;
    const result = pressKey(amount, key, token?.fiatDecimals ?? 2);
    switch (result.status) {
      case "accepted":
        setAmount(result.amount);
        setRejection(null);
        break;
      case "rejected":
        setRejection(token ? rejectionMessage(result.reason, token) : null);
        break;
      default:
        assertNever(result);
    }
  }

  useEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target instanceof Element && event.target.closest("input, textarea, [role=dialog]"))
      return;
    const key = keyFromKeyboard(event.key);
    if (!key) return;
    event.preventDefault();
    press(key);
  });

  const display = formatTypedAmount(amount);
  const ghostDecimals =
    token && amount.includes(".")
      ? "0".repeat(token.fiatDecimals - (amount.split(".")[1]?.length ?? 0))
      : "";
  const length = display.length + ghostDecimals.length;

  function hint() {
    if (mutation.isError)
      return mutation.error instanceof DeviceKeyError
        ? mutation.error.message
        : "Couldn’t create the order. Check your connection, then try again.";
    if (rejection) return rejection;
    if (!token) return "Choose the token you want to receive.";
    if (defaultToken && token.address !== defaultToken.address)
      return `Using ${token.symbol} for this order only.`;
    return "Enter the amount to charge.";
  }
  const isError = mutation.isError || rejection !== null;

  return (
    <form
      noValidate
      aria-busy={busy}
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) mutation.mutate({ token, amount: submittable });
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-6">
        <TokenPicker
          variant="chip"
          title="Receive this order in"
          description={
            defaultToken
              ? `Your default is ${defaultToken.symbol}. Change it in Settings.`
              : "Set a default in Settings to skip this step."
          }
          tokens={collectableTokens}
          value={token}
          disabled={busy}
          onChange={(next) => {
            setToken(next);
            setAmount((current) => fitDecimals(current, next.fiatDecimals));
            setRejection(null);
          }}
        />
        <output
          htmlFor="keypad"
          aria-label="Amount"
          className={cn(
            "w-full truncate text-center font-heading leading-none font-medium tracking-tight tabular-nums transition-[font-size]",
            length > 11 ? "text-4xl" : length > 8 ? "text-5xl" : "text-6xl",
            !amount && "text-muted-foreground/50",
          )}
        >
          {display}
          {ghostDecimals && <span className="text-muted-foreground/50">{ghostDecimals}</span>}
        </output>
        <p
          role={isError ? "alert" : "status"}
          className={cn(
            "min-h-5 text-center text-sm",
            isError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {hint()}
        </p>
      </div>

      <div id="keypad" role="group" aria-label="Keypad" className="grid grid-cols-3 gap-2 px-4">
        {digitKeys.map((key) => (
          <KeypadButton key={key} label={key} disabled={busy} onPress={() => press(key)} />
        ))}
        <KeypadButton
          label="."
          ariaLabel="Decimal point"
          muted
          disabled={busy || token?.fiatDecimals === 0 || amount.includes(".")}
          onPress={() => press(".")}
        />
        <KeypadButton label="0" disabled={busy} onPress={() => press("0")} />
        <KeypadButton
          label={
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
              <path d="m16 10-4 4m0-4 4 4" />
            </svg>
          }
          ariaLabel="Delete"
          muted
          disabled={busy || !amount}
          onPress={() => press("delete")}
        />
      </div>

      <div className="px-4 pt-4 pb-6">
        <Button
          type="submit"
          size="lg"
          className="h-14 w-full rounded-2xl text-base"
          disabled={!canSubmit}
        >
          {busy
            ? "Creating order…"
            : canSubmit
              ? `Create order · ${formatTypedAmount(submittable)} ${token.symbol}`
              : "Create order"}
        </Button>
      </div>
    </form>
  );
}

function KeypadButton({
  label,
  ariaLabel,
  muted = false,
  disabled,
  onPress,
}: {
  label: ReactNode;
  ariaLabel?: string;
  muted?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onPress}
      className={cn(
        "grid h-15 place-items-center rounded-2xl text-2xl font-medium tabular-nums transition-[background-color,transform] duration-75 select-none active:scale-[0.97] disabled:opacity-30",
        muted
          ? "text-muted-foreground hover:bg-muted active:bg-secondary"
          : "bg-muted hover:bg-secondary active:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}

export { CreateOrderForm };
