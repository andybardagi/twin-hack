"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";

import { assertNever } from "@workspace/payments/assert-never";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

import { signOut } from "@/components/auth/sign-out";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Turns the wallet address into a stable angle so each account gets its own avatar. */
function avatarAngle(address: string) {
  return Number.parseInt(address.slice(2, 8), 16) % 360;
}

export function AccountMenu({ address }: { address: string | null }) {
  const [, copyToClipboard] = useCopyToClipboard();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const signOutMutation = useMutation({
    mutationFn: signOut,
    retry: false,
    onSuccess: () => window.location.replace("/sign-in"),
  });
  const signingOut = signOutMutation.isPending || signOutMutation.isSuccess;

  function copyLabel() {
    switch (copy) {
      case "idle":
        return "Copy wallet address";
      case "copied":
        return "Copied";
      case "failed":
        return "Couldn’t copy. Select it above instead.";
      default:
        return assertNever(copy);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="size-10 shrink-0 rounded-full border-2 border-background ring-1 ring-border"
        style={{
          background: `conic-gradient(from ${address ? avatarAngle(address) : 0}deg, var(--primary), var(--chart-2), var(--chart-4), var(--chart-3), var(--primary))`,
        }}
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="grid gap-0.5 px-2 py-2">
            <span>Signed in with</span>
            <span className="font-mono text-sm text-foreground select-all">
              {address ? shortAddress(address) : "Wallet not found"}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-2 py-2" render={<Link href="/orders" />}>
          Order history
        </DropdownMenuItem>
        {address && (
          <DropdownMenuItem
            closeOnClick={false}
            className="px-2 py-2"
            onClick={async () => setCopy((await copyToClipboard(address)) ? "copied" : "failed")}
          >
            {copyLabel()}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          closeOnClick={false}
          disabled={signingOut}
          className="px-2 py-2"
          onClick={() => signOutMutation.mutate()}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
        {signOutMutation.isError && (
          <p role="alert" className="px-2 py-1.5 text-xs text-muted-foreground">
            Couldn’t sign out. Check your connection and try again.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
