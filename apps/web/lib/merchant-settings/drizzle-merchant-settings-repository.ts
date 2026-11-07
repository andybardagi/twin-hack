import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { merchantSettings } from "@/lib/db/schema";
import type { MerchantSettingsRepository } from "@/lib/merchant-settings/merchant-settings-repository";

export const drizzleMerchantSettingsRepository: MerchantSettingsRepository = {
  async findByMerchantId(merchantId) {
    const [settings] = await getDb()
      .select()
      .from(merchantSettings)
      .where(eq(merchantSettings.merchantId, merchantId))
      .limit(1);
    return settings ?? null;
  },
  async save({ merchantId, defaultTokenAddress }) {
    const [settings] = await getDb()
      .insert(merchantSettings)
      .values({ merchantId, defaultTokenAddress })
      .onConflictDoUpdate({
        target: merchantSettings.merchantId,
        set: { defaultTokenAddress },
      })
      .returning();
    if (!settings) throw new Error("Merchant settings upsert did not return a row.");
    return settings;
  },
};
