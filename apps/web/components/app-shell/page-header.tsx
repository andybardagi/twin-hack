import Link from "next/link";
import type { ReactNode } from "react";

/** Sub-page header: back to the charge screen, a title, and an optional action on the right. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-3 pt-4 pb-2">
      <Link
        href="/"
        aria-label="Back to charge screen"
        className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </Link>
      <h1 className="text-center text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </header>
  );
}
