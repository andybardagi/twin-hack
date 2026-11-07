import { cn } from "@workspace/ui/lib/utils";

function TokenChip({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 font-mono text-xs font-medium text-foreground",
        className,
      )}
    >
      {symbol}
    </span>
  );
}

export { TokenChip };
