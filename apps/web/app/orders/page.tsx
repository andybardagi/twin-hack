import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppScreen } from "@/components/app-shell/app-screen";
import { PageHeader } from "@/components/app-shell/page-header";
import { OrderHistory } from "@/components/orders/order-history";
import { getAuth } from "@/lib/auth";
import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import { listOrderHistory } from "@/lib/orders/order-history";

export default async function Page() {
  // Read headers first so Next treats `/orders` as dynamic and never prerenders auth at build time.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) redirect("/sign-in");

  const orders = await listOrderHistory(session.user.id, drizzleOrderRepository);

  return (
    <AppScreen>
      <PageHeader title="Order history" />
      <OrderHistory orders={orders} />
    </AppScreen>
  );
}
