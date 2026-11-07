import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { walletAddress } from "@/lib/db/schema";

export async function getPrimaryWalletAddress(userId: string): Promise<string | null> {
  const [wallet] = await getDb()
    .select({ address: walletAddress.address })
    .from(walletAddress)
    .where(and(eq(walletAddress.userId, userId), eq(walletAddress.isPrimary, true)))
    .limit(1);

  return wallet?.address ?? null;
}
