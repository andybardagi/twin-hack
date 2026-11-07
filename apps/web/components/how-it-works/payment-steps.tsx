"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon } from "@/components/how-it-works/icons";
import { QrArt } from "@/components/how-it-works/qr-art";
import { TokenLogo, TokenText } from "@/components/how-it-works/token-chip";
import type { Copy } from "@/components/how-it-works/copy";

type Mock = Copy["steps"]["mock"];

const stepDurationMs = 4000;
const keypadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

function Phone({
  label,
  tag,
  stage,
  children,
}: {
  label: string;
  tag?: string;
  stage: number;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col items-center gap-3">
      <figcaption className="flex min-h-12 flex-col items-center gap-1 text-center text-sm font-medium text-muted-foreground">
        {label}
        {tag && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            {tag}
          </span>
        )}
      </figcaption>
      <div
        aria-hidden
        className="flex h-112 w-full max-w-64 flex-col overflow-hidden rounded-[2rem] border border-border bg-background p-3 text-foreground shadow-sm"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div key={stage} className="flex min-h-0 flex-1 animate-in flex-col duration-500 fade-in">
          {children}
        </div>
      </div>
    </figure>
  );
}

/** Mirrors the token chip and amount from the app's order screens. */
function OrderAmount({ amount, size = "md" }: { amount: string; size?: "md" | "lg" }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-card py-0.5 pr-2 pl-0.5 text-[0.65rem]">
        <TokenLogo symbol="ARGt" />
        <span className="font-mono font-medium">ARGt</span>
        <span className="text-muted-foreground">Argentine peso</span>
      </span>
      <p
        className={cn(
          "font-heading leading-none font-medium tracking-tight tabular-nums",
          size === "lg" ? "text-3xl" : "text-2xl",
        )}
      >
        {amount}
      </p>
    </div>
  );
}

function SheetHeader({ title }: { title: string }) {
  return (
    <p className="mb-2 grid grid-cols-[1rem_1fr_1rem] items-center text-center text-xs font-semibold">
      <span className="text-muted-foreground">‹</span>
      {title}
    </p>
  );
}

function KeypadScreen({ mock }: { mock: Mock }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <OrderAmount amount={mock.amount} size="lg" />
        <p className="text-[0.65rem] text-muted-foreground">{mock.enterAmount}</p>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {keypadKeys.map((key) => (
          <span
            key={key}
            className={cn(
              "grid h-8 place-items-center rounded-lg text-sm font-medium",
              key === "." || key === "⌫" ? "text-muted-foreground" : "bg-muted",
            )}
          >
            {key}
          </span>
        ))}
      </div>
      <span className="mt-2 grid h-9 place-items-center rounded-xl bg-primary text-[0.65rem] font-medium text-primary-foreground">
        {mock.createOrder} · {mock.amount} ARGt
      </span>
    </>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[0.65rem] font-medium">
      <span className="size-1.5 rounded-full bg-primary motion-safe:animate-pulse" />
      {children}
    </span>
  );
}

function OrderQrScreen({ mock }: { mock: Mock }) {
  return (
    <>
      <SheetHeader title={mock.order} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <OrderAmount amount={mock.amount} />
        <div className="rounded-2xl border border-border bg-white p-2 text-black">
          <QrArt className="size-24 fill-black" />
        </div>
        <span className="rounded-full border border-border px-2 py-1 text-[0.6rem]">
          {mock.copyLink}
        </span>
        <StatusPill>
          {mock.waitingPayment} · <span className="font-mono tabular-nums">04:58</span>
        </StatusPill>
        <p className="max-w-[24ch] text-[0.6rem] text-muted-foreground">{mock.showCode}</p>
      </div>
    </>
  );
}

function CameraScreen({ mock, scanning }: { mock: Mock; scanning: boolean }) {
  return (
    <div className="-m-3 -mt-7 flex flex-1 flex-col items-center justify-center gap-4 bg-neutral-900 p-3 text-white">
      <p className="text-[0.65rem] opacity-80">{scanning ? mock.scanning : mock.waitingScan}</p>
      <div className="relative flex size-36 items-center justify-center">
        {scanning && (
          <span className="rounded-lg bg-white p-1.5">
            <QrArt className="size-24 fill-black" />
          </span>
        )}
        <span className="absolute top-0 left-0 size-5 rounded-tl-lg border-t-2 border-l-2 border-white" />
        <span className="absolute top-0 right-0 size-5 rounded-tr-lg border-t-2 border-r-2 border-white" />
        <span className="absolute bottom-0 left-0 size-5 rounded-bl-lg border-b-2 border-l-2 border-white" />
        <span className="absolute right-0 bottom-0 size-5 rounded-br-lg border-r-2 border-b-2 border-white" />
      </div>
    </div>
  );
}

function PayScreen({ mock, picking }: { mock: Mock; picking: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
      <p className="text-sm font-semibold tracking-tight">{mock.paymentRequest}</p>
      <OrderAmount amount={mock.amount} />
      <p className="flex items-start gap-1 text-[0.6rem] text-muted-foreground">
        <CheckIcon className="size-3 text-primary" />
        {mock.verified}
      </p>
      {picking && (
        <div className="mt-auto flex flex-col gap-2">
          <p className="text-[0.65rem] font-medium">{mock.payWith}</p>
          <span className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
            <TokenLogo symbol="BRAt" className="size-6" />
            <span className="grid flex-1 leading-tight">
              <span className="font-mono text-[0.65rem] font-medium">BRAt</span>
              <span className="text-[0.6rem] text-muted-foreground">Brazilian real</span>
            </span>
            <span className="text-muted-foreground">⌄</span>
          </span>
          <p className="text-[0.6rem] text-muted-foreground">
            <TokenText>{mock.quote}</TokenText>
          </p>
          <span className="grid h-8 place-items-center rounded-lg bg-primary text-[0.65rem] font-medium text-primary-foreground">
            {mock.payButton}
          </span>
          <p className="text-[0.6rem] text-muted-foreground">{mock.signing}</p>
        </div>
      )}
    </div>
  );
}

function ConfirmedScreen({ title, mock }: { title: string; mock: Mock }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="grid size-16 animate-in place-items-center rounded-full bg-primary text-primary-foreground duration-500 zoom-in-50">
        <CheckIcon className="size-8" />
      </span>
      <p className="font-heading text-base font-semibold tracking-tight">{title}</p>
      <OrderAmount amount={mock.amount} />
    </div>
  );
}

function PaymentSteps({ text, customerTag }: { text: Copy["steps"]; customerTag: string }) {
  const { mock } = text;
  const steps = [
    {
      ...text.charge,
      merchantScreen: <KeypadScreen mock={mock} />,
      customerScreen: <CameraScreen mock={mock} scanning={false} />,
    },
    {
      ...text.qr,
      merchantScreen: <OrderQrScreen mock={mock} />,
      customerScreen: <CameraScreen mock={mock} scanning />,
    },
    {
      ...text.scan,
      merchantScreen: <OrderQrScreen mock={mock} />,
      customerScreen: <PayScreen mock={mock} picking={false} />,
    },
    {
      ...text.pick,
      merchantScreen: <OrderQrScreen mock={mock} />,
      customerScreen: <PayScreen mock={mock} picking />,
    },
    {
      ...text.done,
      merchantScreen: <ConfirmedScreen title={mock.paymentReceived} mock={mock} />,
      customerScreen: <ConfirmedScreen title={mock.paid} mock={mock} />,
    },
  ];
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0.5 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeout = window.setTimeout(
      () => setStage((current) => (current + 1) % steps.length),
      stepDurationMs,
    );
    return () => window.clearTimeout(timeout);
  }, [isVisible, stage, steps.length]);

  const step = steps[stage];
  if (!step) throw new Error(`Unknown payment step: ${stage}`);

  return (
    <div
      ref={containerRef}
      className="grid items-center gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <Phone label={mock.merchantPhone} stage={stage}>
          {step.merchantScreen}
        </Phone>
        <Phone label={mock.customerPhone} tag={customerTag} stage={stage}>
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
                "relative flex w-full gap-3 overflow-hidden rounded-xl border p-4 text-left transition-colors",
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
              {index === stage &&
                isVisible && (
                  // Fills over the same time as the auto-advance timer, and restarts with it.
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-border motion-reduce:hidden"
                  >
                    <span
                      key={stage}
                      style={{ animationDuration: `${stepDurationMs}ms` }}
                      className="block h-full animate-in bg-primary ease-linear fill-mode-both slide-in-from-left-full"
                    />
                  </span>
                )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { PaymentSteps };
