import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { formatUnits } from "viem";
import { z } from "zod";

import { AppScreen } from "@/components/app-shell/app-screen";
import { OrderSettlement } from "@/components/orders/order-settlement";
import { getAuth } from "@/lib/auth";
import { findMerchantOrder } from "@/lib/orders/find-merchant-order";
import { formatOrderDisplay } from "@/src/helpers/order-display";
import { findCollectableToken } from "@/src/helpers/tokens";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const order = await findMerchantOrder(id, session.user.id);
  if (!order) notFound();

  const origin = new URL(z.url().parse(process.env.BETTER_AUTH_URL)).origin;
  const payUrl = new URL(`/pay/order/${order.id}`, origin).href;
  const token = findCollectableToken(order.tokenAddress);
  const chargeAgain = token
    ? `/?${new URLSearchParams({ token: token.address, amount: formatUnits(BigInt(order.amount), token.decimals) })}`
    : "/";

  return (
    <AppScreen>
      <OrderSettlement
        id={order.id}
        payUrl={payUrl}
        expiresAt={order.expiresAt.toISOString()}
        display={formatOrderDisplay(order.amount, order.tokenAddress)}
        chargeAgainHref={chargeAgain}
      />
    </AppScreen>
  );
}
