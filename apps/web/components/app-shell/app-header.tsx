import Link from "next/link";

import { AccountMenu } from "@/components/auth/account-menu";
import { PonteMark } from "@/components/brand/ponte-logo";

export function AppHeader({ address }: { address: string | null }) {
  return (
    <header className="flex items-center justify-between px-4 pt-4 pb-2">
      <Link href="/" aria-label="Ponte home" className="rounded-lg">
        <PonteMark size={36} />
      </Link>
      <div className="flex items-center gap-1.5">
        <Link
          href="/settings"
          aria-label="Settings"
          className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
        </Link>
        <AccountMenu address={address} />
      </div>
    </header>
  );
}
