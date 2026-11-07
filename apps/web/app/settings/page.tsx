import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAddress } from "viem";

import { assertNever } from "@workspace/payments/assert-never";

import { SigningKeySettings } from "@/components/settings/signing-key-settings";
import { getAuth } from "@/lib/auth";
import { getChainConfig } from "@/lib/chain/chain-config";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";

export default async function Page() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");
  const merchant = await getPrimaryWalletAddress(session.user.id);
  const config = getChainConfig();
  function content() {
    if (!merchant)
      return <p role="alert">Your wallet couldn’t be found. Sign out and sign in again.</p>;
    switch (config.status) {
      case "not-configured":
        return <p>Signing key settings are not available yet. Try again later.</p>;
      case "configured":
        return <SigningKeySettings merchant={getAddress(merchant)} router={config.routerAddress} />;
      default:
        return assertNever(config);
    }
  }
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <section
        className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
        aria-labelledby="settings-heading"
      >
        <Link className="text-sm underline" href="/">
          Back to account
        </Link>
        <h1 id="settings-heading" className="text-2xl font-semibold tracking-tight">
          Signing key settings
        </h1>
        {content()}
      </section>
    </main>
  );
}
