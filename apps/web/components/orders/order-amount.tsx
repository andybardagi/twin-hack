import type { formatOrderDisplay } from "@/src/helpers/order-display";

export function OrderAmount({ amount, token }: ReturnType<typeof formatOrderDisplay>) {
  return (
    <dl className="space-y-4">
      <div className="space-y-2">
        <dt className="text-sm text-muted-foreground">Requested amount</dt>
        <dd className="break-all text-2xl font-semibold">{amount}</dd>
      </div>
      <div className="space-y-2">
        <dt className="text-sm text-muted-foreground">Token</dt>
        <dd className="break-all">{token}</dd>
      </div>
    </dl>
  );
}
