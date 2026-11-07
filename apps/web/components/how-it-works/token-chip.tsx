import { Fragment } from "react";

import { cn } from "@workspace/ui/lib/utils";
import { tokens } from "@/src/helpers/tokens";

const tokenSymbolPattern = new RegExp(`\\b(${tokens.map((token) => token.symbol).join("|")})\\b`);

function TokenLogo({ symbol, className }: { symbol: string; className?: string }) {
  const token = tokens.find((candidate) => candidate.symbol === symbol);
  if (!token) throw new Error(`Unknown token: ${symbol}`);
  return (
    <img
      src={token.icon}
      alt=""
      fetchPriority="low"
      className={cn("size-4 shrink-0 rounded-full", className)}
    />
  );
}

function TokenChip({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background py-1 pr-2.5 pl-1 font-mono text-xs font-medium text-foreground",
        className,
      )}
    >
      <TokenLogo symbol={symbol} />
      {symbol}
    </span>
  );
}

/** Every token's icon in an overlapping row. */
function TokenStack({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex -space-x-2", className)}>
      {tokens.map((token) => (
        <TokenLogo key={token.symbol} symbol={token.symbol} className="size-8 ring-2 ring-card" />
      ))}
    </span>
  );
}

/** Prose with an icon in front of every token symbol it mentions. */
function TokenText({ children }: { children: string }) {
  // split with a capture group puts the matched symbols at odd indexes.
  return children.split(tokenSymbolPattern).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className="whitespace-nowrap">
        <TokenLogo symbol={part} className="mr-1 inline size-[1.1em] align-[-0.2em]" />
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

export { TokenChip, TokenLogo, TokenStack, TokenText };
