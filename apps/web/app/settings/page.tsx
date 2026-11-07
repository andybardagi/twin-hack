import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAddress } from "viem";

import { DefaultReceiveTokenSettings } from "@/components/settings/default-receive-token-settings";
import { ForwardAddressSettings } from "@/components/settings/forward-address-settings";
import { SettingsWagmiProvider } from "@/components/settings/settings-wagmi-provider";
import { SigningKeySettings } from "@/components/settings/signing-key-settings";
import { getAuth } from "@/lib/auth";
import { getChainConfig } from "@/lib/chain/chain-config";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";

export default async function Page() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");
  const merchant = await getPrimaryWalletAddress(session.user.id);
  const { routerAddress } = getChainConfig();
  function chainContent() {
    if (!merchant)
      return <p role="alert">Your wallet couldn’t be found. Sign out and sign in again.</p>;
    return (
      <SettingsWagmiProvider>
        <section className="space-y-3" aria-labelledby="signing-key-heading">
          <h2 id="signing-key-heading" className="text-lg font-medium">
            Signing key
          </h2>
          <SigningKeySettings merchant={getAddress(merchant)} router={routerAddress} />
        </section>
        <section className="space-y-3" aria-labelledby="forward-address-heading">
          <h2 id="forward-address-heading" className="text-lg font-medium">
            Forward address
          </h2>
          <ForwardAddressSettings merchant={getAddress(merchant)} router={routerAddress} />
        </section>
      </SettingsWagmiProvider>
    );
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
          Settings
        </h1>
        {chainContent()}
        <section className="space-y-3" aria-labelledby="default-receive-token-heading">
          <h2 id="default-receive-token-heading" className="text-lg font-medium">
            Default receive token
          </h2>
          <DefaultReceiveTokenSettings />
        </section>
      </section>
    </main>
  );
}
