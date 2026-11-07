import type { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { merchantSettingsInputSchema } from "@/src/helpers/merchant-settings-schema";

export class DefaultReceiveTokenError extends Error {
  constructor(public readonly status: number) {
    super("Couldn't load or save the default token. Check your connection and try again.");
  }
}

export async function readDefaultReceiveToken(): Promise<string | null> {
  const { data, error } = await apiClient.api["merchant-settings"].get();
  if (error) throw new DefaultReceiveTokenError(error.status);
  return data.defaultTokenAddress;
}

export async function saveDefaultReceiveToken(
  input: z.input<typeof merchantSettingsInputSchema>,
): Promise<void> {
  const { error } = await apiClient.api["merchant-settings"].put(
    merchantSettingsInputSchema.parse(input),
  );
  if (error) throw new DefaultReceiveTokenError(error.status);
}
