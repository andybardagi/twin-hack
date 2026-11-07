import { TokenIcon } from "@/components/tokens/token-picker";
import { formatTypedAmount } from "@/src/helpers/keypad";
import type { formatOrderDisplay } from "@/src/helpers/order-display";
import { tokens } from "@/src/helpers/tokens";

export function OrderAmount({ amount, token }: ReturnType<typeof formatOrderDisplay>) {
  const known = tokens.find((candidate) => candidate.symbol === token);
  const [whole = "", fraction = ""] = amount.split(".");
  const shown =
    known && /^\d+$/.test(whole)
      ? formatTypedAmount(
          known.fiatDecimals > 0 ? `${whole}.${fraction.padEnd(known.fiatDecimals, "0")}` : whole,
        )
      : amount;

  return (
    <dl className="flex flex-col items-center gap-2.5">
      <dt className="sr-only">Token</dt>
      <dd className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-sm">
        {known && <TokenIcon token={known} />}
        <span className="font-mono font-medium">{token}</span>
        {known && <span className="text-muted-foreground">{known.name}</span>}
      </dd>
      <dt className="sr-only">Requested amount</dt>
      <dd className="font-heading text-4xl leading-none font-medium tracking-tight break-all tabular-nums">
        {shown}
      </dd>
    </dl>
  );
}
