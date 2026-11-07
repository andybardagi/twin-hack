import type { ReactNode } from "react";

/** Animated check shown once a payment settles, to the merchant and to the customer. */
export function PaymentConfirmed({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-5 text-center">
      <div className="relative grid size-24 place-items-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-[ping_1.1s_cubic-bezier(0,0,0.2,1)_0.15s_2_forwards] motion-reduce:hidden"
        />
        <span className="relative grid size-24 place-items-center rounded-full bg-primary text-primary-foreground motion-safe:animate-in motion-safe:duration-500 motion-safe:zoom-in-50 motion-safe:fade-in">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-12 motion-safe:animate-in motion-safe:delay-300 motion-safe:duration-300 motion-safe:fill-mode-backwards motion-safe:zoom-in-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </div>
      <div className="grid gap-1.5 motion-safe:animate-in motion-safe:delay-500 motion-safe:duration-500 motion-safe:fill-mode-backwards motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
        <p className="font-heading text-2xl font-semibold tracking-tight">{title}</p>
        {children}
      </div>
    </div>
  );
}
