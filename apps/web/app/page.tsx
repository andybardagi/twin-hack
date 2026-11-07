import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAddress } from "viem";

import { AppHeader } from "@/components/app-shell/app-header";
import { AppScreen } from "@/components/app-shell/app-screen";
import { OrderSigningGate } from "@/components/orders/order-signing-gate";
import { getAuth } from "@/lib/auth";
import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { drizzleMerchantSettingsRepository } from "@/lib/merchant-settings/drizzle-merchant-settings-repository";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";
import { findCollectableToken } from "@/src/helpers/tokens";

/** `?token=&amount=` prefill the keypad, e.g. "Charge again" on an expired order. */
function prefill(searchParams: Record<string, string | string[] | undefined>) {
  const { token, amount } = searchParams;
  return {
    initialTokenAddress:
      typeof token === "string" ? findCollectableToken(token)?.address : undefined,
    initialAmount: typeof amount === "string" && /^\d+(\.\d+)?$/.test(amount) ? amount : undefined,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const wallet = await getPrimaryWalletAddress(session.user.id);
  if (!wallet)
    return (
      <AppScreen>
        <AppHeader address={null} />
        <p role="alert" className="m-auto max-w-xs px-8 text-center text-balance">
          Your wallet address couldn’t be found. Sign out and sign in again to retry.
        </p>
      </AppScreen>
    );

  const merchant = getAddress(wallet);
  const { routerAddress, reader } = getRouterReader();
  // A failed read reaches the error boundary, which offers a retry; it never opens the keypad.
  const [signingKey, settings] = await Promise.all([
    reader.signingKeyOf(merchant),
    drizzleMerchantSettingsRepository.findByMerchantId(session.user.id),
  ]);
  const defaultToken = settings && findCollectableToken(settings.defaultTokenAddress);

  return (
    <AppScreen>
      <AppHeader address={merchant} />
      <OrderSigningGate
        merchant={merchant}
        router={routerAddress}
        signingKey={signingKey}
        defaultTokenAddress={defaultToken?.address ?? ""}
        {...prefill(await searchParams)}
      />
    </AppScreen>
  );
}
