import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { OrderAmount } from "@/components/orders/order-amount";
import { OrderQrCode } from "@/components/orders/order-qr-code";
import { getAuth } from "@/lib/auth";
import { findMerchantOrder } from "@/lib/orders/find-merchant-order";
import { formatOrderDisplay } from "@/src/helpers/order-display";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const order = await findMerchantOrder(id, session.user.id);
  if (!order) notFound();

  const origin = new URL(z.url().parse(process.env.BETTER_AUTH_URL)).origin;
  const payUrl = new URL(`/pay/order/${order.id}`, origin).href;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <section
        aria-labelledby="order-heading"
        className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <h1 id="order-heading" className="text-2xl font-semibold tracking-tight">
          Order
        </h1>
        <OrderAmount {...formatOrderDisplay(order.amount, order.tokenAddress)} />
        <OrderQrCode url={payUrl} />
        <p className="text-sm text-muted-foreground">Scan the QR code to view this order.</p>
      </section>
    </main>
  );
}
