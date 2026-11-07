import type { ReactNode } from "react";

import { CheckIcon } from "@/components/how-it-works/icons";
import { QrArt } from "@/components/how-it-works/qr-art";
import { TokenChip } from "@/components/how-it-works/token-chip";
import type { Copy } from "@/components/how-it-works/copy";

type Mock = Copy["steps"]["mock"];

function Phone({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="mx-auto flex h-96 w-full max-w-60 flex-col rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-sm"
    >
      <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" />
      {children}
    </div>
  );
}

function MerchantScreen({ mock }: { mock: Mock }) {
  return (
    <>
      <p className="text-center text-xs text-muted-foreground">{mock.newCharge}</p>
      <p className="mt-1 text-center text-xl font-semibold tracking-tight">{mock.amount} ARGt</p>
      <div className="mt-4 flex flex-1 items-center justify-center">
        <QrArt className="size-36" />
      </div>
      <p className="text-center text-xs text-muted-foreground">{mock.scanToPay}</p>
    </>
  );
}

function ScanScreen({ mock }: { mock: Mock }) {
  return (
    <>
      <p className="text-center text-xs text-muted-foreground">{mock.scanning}</p>
      <div className="relative mx-auto mt-3 flex size-36 items-center justify-center">
        <QrArt className="size-28 opacity-40" />
        <span className="absolute top-0 left-0 size-5 rounded-tl-lg border-t-2 border-l-2 border-foreground" />
        <span className="absolute top-0 right-0 size-5 rounded-tr-lg border-t-2 border-r-2 border-foreground" />
        <span className="absolute bottom-0 left-0 size-5 rounded-bl-lg border-b-2 border-l-2 border-foreground" />
        <span className="absolute right-0 bottom-0 size-5 rounded-br-lg border-r-2 border-b-2 border-foreground" />
      </div>
      <div className="mt-auto space-y-2 rounded-xl bg-muted p-3 text-center">
        <p className="flex items-center justify-center gap-1 text-xs font-medium">
          <CheckIcon className="size-3.5" />
          {mock.verified}
        </p>
        <p className="text-xs text-muted-foreground">{mock.merchantAsks}</p>
        <p className="text-base font-semibold tracking-tight">{mock.amount} ARGt</p>
      </div>
    </>
  );
}

function QuoteRow({
  symbol,
  amount,
  route,
  selected = false,
}: {
  symbol: string;
  amount: string;
  route: string;
  selected?: boolean;
}) {
  return (
    <div
      data-selected={selected}
      className="flex items-center justify-between gap-2 rounded-xl border border-border p-2 data-[selected=true]:border-foreground"
    >
      <TokenChip symbol={symbol} className="px-2 py-0.5" />
      <div className="text-right">
        <p className="text-xs font-medium">{amount}</p>
        <p className="text-[0.7rem] text-muted-foreground">{route}</p>
      </div>
    </div>
  );
}

function PickScreen({ mock }: { mock: Mock }) {
  return (
    <>
      <p className="text-center text-xs text-muted-foreground">
        {mock.merchantAsks} {mock.amount} ARGt
      </p>
      <p className="mt-4 mb-2 text-sm font-medium">{mock.payWith}</p>
      <div className="flex flex-col gap-2">
        <QuoteRow symbol="BRAt" amount={mock.bratQuote} route={mock.twoSwaps} selected />
        <QuoteRow symbol="USDT" amount={mock.usdtQuote} route={mock.oneSwap} />
        <QuoteRow symbol="ARGt" amount={mock.amount} route={mock.direct} />
      </div>
      <div className="mt-auto rounded-lg bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
        {mock.sign}
      </div>
    </>
  );
}

function DoneScreen({ mock }: { mock: Mock }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckIcon className="size-7" />
      </span>
      <p className="text-base font-semibold tracking-tight">{mock.paid}</p>
      <p className="text-sm">{mock.amount} ARGt</p>
      <p className="text-xs text-muted-foreground">{mock.order}</p>
    </div>
  );
}

function PaymentSteps({ text }: { text: Copy["steps"] }) {
  const steps = [
    { ...text.merchant, screen: <MerchantScreen mock={text.mock} /> },
    { ...text.scan, screen: <ScanScreen mock={text.mock} /> },
    { ...text.pick, screen: <PickScreen mock={text.mock} /> },
    { ...text.done, screen: <DoneScreen mock={text.mock} /> },
  ];

  return (
    <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {steps.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-4">
          <Phone>{step.screen}</Phone>
          <div className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
              {index + 1}
            </span>
            <div className="space-y-1">
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export { PaymentSteps };
