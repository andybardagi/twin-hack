import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAddress } from "viem";

import { AppScreen } from "@/components/app-shell/app-screen";
import { PageHeader } from "@/components/app-shell/page-header";
import { BeloLogo } from "@/components/brand/belo-logo";
import { DefaultReceiveTokenSettings } from "@/components/settings/default-receive-token-settings";
import { ForwardAddressSettings } from "@/components/settings/forward-address-settings";
import { SettingsWagmiProvider } from "@/components/settings/settings-wagmi-provider";
import { SigningKeySettings } from "@/components/settings/signing-key-settings";
import { getAuth } from "@/lib/auth";
import { getChainConfig } from "@/lib/chain/chain-config";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";

function SettingCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground"
    >
      <div className="grid gap-0.5">
        <h2 id={id} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function Page() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const wallet = await getPrimaryWalletAddress(session.user.id);
  const { routerAddress } = getChainConfig();

  return (
    <AppScreen>
      <PageHeader title="Settings" />
      <div className="grid gap-3.5 px-3.5 pt-2 pb-8">
        <SettingCard
          id="default-receive-token-heading"
          title="Receive payments in"
          description="Default token for new orders. You can switch it per order from the charge screen."
        >
          <DefaultReceiveTokenSettings />
        </SettingCard>
        {wallet ? (
          <SettingsWagmiProvider>
            <SettingCard
              id="forward-address-heading"
              title="Forward address"
              description="Every settled payment is sent to this address."
            >
              <div className="flex items-center gap-3 rounded-xl bg-muted p-3.5">
                <BeloLogo className="h-6.5" />
                <p className="text-sm leading-snug font-medium text-balance">
                  Use Belo and convert to fiat without fees!
                </p>
              </div>
              <ForwardAddressSettings merchant={getAddress(wallet)} router={routerAddress} />
            </SettingCard>
            <SettingCard
              id="signing-key-heading"
              title="Signing key"
              description="This device signs your orders so customers know they came from you."
            >
              <SigningKeySettings merchant={getAddress(wallet)} router={routerAddress} />
            </SettingCard>
          </SettingsWagmiProvider>
        ) : (
          <p role="alert" className="px-1">
            Your wallet couldn’t be found. Sign out and sign in again.
          </p>
        )}
      </div>
    </AppScreen>
  );
}
