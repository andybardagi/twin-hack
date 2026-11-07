"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon } from "@/components/how-it-works/icons";
import { QrArt } from "@/components/how-it-works/qr-art";
import { TokenChip } from "@/components/how-it-works/token-chip";
import type { Copy } from "@/components/how-it-works/copy";

type Mock = Copy["steps"]["mock"];

const stepDurationMs = 3500;

function Phone({ label, stage, children }: { label: string; stage: number; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <figcaption className="text-sm font-medium text-muted-foreground">{label}</figcaption>
      <div
        aria-hidden
        className="flex h-96 w-full max-w-60 flex-col rounded-3xl border border-border bg-card p-4 text-card-foreground shadow-sm"
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div key={stage} className="flex flex-1 animate-in flex-col duration-500 fade-in">
          {children}
        </div>
      </div>
    </figure>
  );
}

function MerchantScreen({ mock, status }: { mock: Mock; status: string }) {
  return (
    <>
      <p className="text-center text-xs text-muted-foreground">{mock.newCharge}</p>
      <p className="mt-1 text-center text-xl font-semibold tracking-tight">{mock.amount} ARGt</p>
      <div className="mt-4 flex flex-1 items-center justify-center">
        <QrArt className="size-36" />
      </div>
      <p className="text-center text-xs text-muted-foreground">{status}</p>
    </>
  );
}

function ScanScreen({ mock, verified }: { mock: Mock; verified: boolean }) {
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
      {verified ? (
        <div className="mt-auto space-y-2 rounded-xl bg-muted p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-xs font-medium">
            <CheckIcon className="size-3.5" />
            {mock.verified}
          </p>
          <p className="text-xs text-muted-foreground">{mock.merchantAsks}</p>
          <p className="text-base font-semibold tracking-tight">{mock.amount} ARGt</p>
        </div>
      ) : (
        <p className="mt-auto text-center text-xs text-muted-foreground">{mock.waitingScan}</p>
      )}
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
      <span className="flex size-14 animate-in items-center justify-center rounded-full bg-primary text-primary-foreground duration-500 zoom-in-50">
        <CheckIcon className="size-7" />
      </span>
      <p className="text-base font-semibold tracking-tight">{mock.paid}</p>
      <p className="text-sm">{mock.amount} ARGt</p>
      <p className="text-xs text-muted-foreground">{mock.order}</p>
    </div>
  );
}

function PaymentSteps({ text }: { text: Copy["steps"] }) {
  const { mock } = text;
  const steps = [
    {
      ...text.merchant,
      merchantScreen: <MerchantScreen mock={mock} status={mock.scanToPay} />,
      customerScreen: <ScanScreen mock={mock} verified={false} />,
    },
    {
      ...text.scan,
      merchantScreen: <MerchantScreen mock={mock} status={mock.waitingPayment} />,
      customerScreen: <ScanScreen mock={mock} verified />,
    },
    {
      ...text.pick,
      merchantScreen: <MerchantScreen mock={mock} status={mock.waitingPayment} />,
      customerScreen: <PickScreen mock={mock} />,
    },
    {
      ...text.done,
      merchantScreen: <DoneScreen mock={mock} />,
      customerScreen: <DoneScreen mock={mock} />,
    },
  ];
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeout = window.setTimeout(
      () => setStage((current) => (current + 1) % steps.length),
      stepDurationMs,
    );
    return () => window.clearTimeout(timeout);
  }, [stage, steps.length]);

  const step = steps[stage];
  if (!step) throw new Error(`Unknown payment step: ${stage}`);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <Phone label={mock.merchantPhone} stage={stage}>
          {step.merchantScreen}
        </Phone>
        <Phone label={mock.customerPhone} stage={stage}>
          {step.customerScreen}
        </Phone>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((item, index) => (
          <li key={item.title}>
            <button
              type="button"
              aria-current={index === stage ? "step" : undefined}
              onClick={() => setStage(index)}
              className={cn(
                "flex w-full gap-3 rounded-xl border p-4 text-left transition-colors",
                index === stage
                  ? "border-foreground bg-card"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                {index + 1}
              </span>
              <span className="space-y-1">
                <span className="block font-medium">{item.title}</span>
                <span className="block text-sm text-muted-foreground">{item.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { PaymentSteps };
