import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getAddress, isAddress } from "viem";

import { SignInProvider } from "@/components/auth/sign-in-provider";
import { PayOrderForm } from "@/components/orders/pay-order-form";
import { PayOrderStatus } from "@/components/orders/pay-order-status";
import { getAuth } from "@/lib/auth";
import { getRouterReader } from "@/lib/chain/viem-router-reader";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { verifyPayOrder, type PayOrder } from "@/lib/orders/pay-order";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";

async function payment(id: string, order: Extract<PayOrder, { status: "valid" }>) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return <SignInProvider redirectTo={`/pay/order/${id}`} />;

  const payer = await getPrimaryWalletAddress(session.user.id);
  if (!payer || !isAddress(payer, { strict: false }))
    return <p role="alert">Your wallet couldn’t be found. Sign out and sign in again.</p>;
  return <PayOrderForm orderId={id} payer={getAddress(payer)} terms={order.payment} />;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;

  const order = await verifyPayOrder(id, drizzleOrderRepository, getRouterReader);
  if (order.status === "not-found") notFound();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <section
        aria-labelledby="payment-request-heading"
        className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <h1 id="payment-request-heading" className="text-2xl font-semibold tracking-tight">
          Payment request
        </h1>
        <PayOrderStatus
          order={order}
          retryHref={`/pay/order/${id}`}
          payment={order.status === "valid" ? await payment(id, order) : undefined}
        />
      </section>
    </main>
  );
}
