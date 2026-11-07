import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@workspace/ui/components/button";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuth } from "@/lib/auth";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";

export default async function Page() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  const address = await getPrimaryWalletAddress(session.user.id);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <section
        aria-labelledby="account-heading"
        className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <h1 id="account-heading" className="text-2xl font-semibold tracking-tight">
          Your account
        </h1>
        {address ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Signed in with</p>
            <p className="break-all font-mono text-sm">{address}</p>
          </div>
        ) : (
          <p role="alert" className="text-sm text-muted-foreground">
            Your wallet address couldn’t be found. Sign out and sign in again to retry.
          </p>
        )}
        <Button render={<Link href="/orders/new" />}>New order</Button>
        <Button variant="outline" render={<Link href="/settings" />}>
          Settings
        </Button>
        <SignOutButton />
      </section>
    </main>
  );
}
