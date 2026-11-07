import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CreateOrderForm } from "@/components/orders/create-order-form";
import { getAuth } from "@/lib/auth";

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
        <CreateOrderForm />
      </section>
    </main>
  );
}
