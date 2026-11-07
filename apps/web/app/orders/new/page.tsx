import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAddress } from "viem";

import { OrderSigningGate } from "@/components/orders/order-signing-gate";
import { getAuth } from "@/lib/auth";
import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { drizzleMerchantSettingsRepository } from "@/lib/merchant-settings/drizzle-merchant-settings-repository";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";
import { findCollectableToken } from "@/src/helpers/tokens";

async function orderContent(merchantId: string) {
  const wallet = await getPrimaryWalletAddress(merchantId);
  if (!wallet) {
    return <p role="alert">Your wallet couldn’t be found. Sign out and sign in again.</p>;
  }
  const merchant = getAddress(wallet);
  const { routerAddress, reader } = getRouterReader();
  // A failed read reaches the error boundary, which offers a retry; it never opens the form.
  const [signingKey, settings] = await Promise.all([
    reader.signingKeyOf(merchant),
    drizzleMerchantSettingsRepository.findByMerchantId(merchantId),
  ]);
  const defaultToken = settings && findCollectableToken(settings.defaultTokenAddress);
  return (
    <OrderSigningGate
      merchant={merchant}
      router={routerAddress}
      signingKey={signingKey}
      defaultTokenAddress={defaultToken?.address ?? ""}
    />
  );
}

export default async function Page() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <section
        aria-labelledby="create-order-heading"
        className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <h1 id="create-order-heading" className="text-2xl font-semibold tracking-tight">
          New order
        </h1>
        {await orderContent(session.user.id)}
      </section>
    </main>
  );
}
