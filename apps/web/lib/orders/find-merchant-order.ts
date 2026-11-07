import { drizzleOrderRepository } from "@/lib/orders/drizzle-order-repository";
import type { OrderRepository } from "@/lib/orders/order-repository";

export async function findMerchantOrder(
  id: string,
  merchantId: string,
): ReturnType<OrderRepository["findById"]> {
  const order = await drizzleOrderRepository.findById(id);
  return order?.merchantId === merchantId ? order : null;
}
