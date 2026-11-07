import { notFound } from "next/navigation";
import { connection } from "next/server";

import { OrderAmount } from "@/components/orders/order-amount";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { formatOrderDisplay } from "@/src/helpers/order-display";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;

  const order = await drizzleOrderRepository.findById(id);
  if (!order) notFound();

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <section
        aria-labelledby="payment-request-heading"
        className="w-full max-w-lg space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground"
      >
        <h1 id="payment-request-heading" className="text-2xl font-semibold tracking-tight">
          Payment request
        </h1>
        <OrderAmount {...formatOrderDisplay(order.amount, order.tokenAddress)} />
      </section>
    </main>
  );
}
