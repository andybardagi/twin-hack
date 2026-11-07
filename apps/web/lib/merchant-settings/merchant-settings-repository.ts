import type { merchantSettings } from "@/lib/db/schema";

type MerchantSettings = typeof merchantSettings.$inferSelect;

export interface MerchantSettingsRepository {
  findByMerchantId(merchantId: string): Promise<MerchantSettings | null>;
  save(settings: MerchantSettings): Promise<MerchantSettings>;
}
