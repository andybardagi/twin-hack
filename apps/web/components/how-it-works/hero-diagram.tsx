import type { ReactNode } from "react";

import { ArrowIcon } from "@/components/how-it-works/icons";
import { TokenStack } from "@/components/how-it-works/token-chip";
import type { Copy } from "@/components/how-it-works/copy";

function Party({ name, action, tag }: { name: string; action: string; tag?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center text-card-foreground">
      <p className="font-medium">{name}</p>
      {tag}
      <p className="text-sm text-muted-foreground">{action}</p>
      <TokenStack className="mt-1" />
    </div>
  );
}

function HeroDiagram({ text }: { text: Copy["hero"] }) {
  return (
    <figure
      role="img"
      aria-label={text.diagramLabel}
      className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center"
    >
      <Party
        name={text.customer}
        action={text.paysIn}
        tag={
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {text.customerTag}
          </span>
        }
      />
      <ArrowIcon className="self-center text-muted-foreground max-sm:rotate-90" />
      <div className="flex flex-1 flex-col items-center gap-1 rounded-xl bg-primary p-6 text-center text-primary-foreground">
        <p className="font-medium">{text.converted}</p>
        <p className="text-sm opacity-80">{text.sameTransaction}</p>
      </div>
      <ArrowIcon className="self-center text-muted-foreground max-sm:rotate-90" />
      <Party name={text.merchant} action={text.receives} />
    </figure>
  );
}

export { HeroDiagram };
