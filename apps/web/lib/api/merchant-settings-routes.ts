import { Elysia } from "elysia";
import { z } from "zod";

import type { MerchantSettingsRepository } from "@/lib/merchant-settings/merchant-settings-repository";
import type { SessionReader } from "@/lib/session/session-reader";
import { merchantSettingsInputSchema } from "@/src/helpers/merchant-settings-schema";

const errorSchema = z.object({ message: z.string() });
const settingsSchema = z.object({ defaultTokenAddress: z.string().nullable() });

export function merchantSettingsRoutes(
  repository: MerchantSettingsRepository,
  sessions: SessionReader,
) {
  return new Elysia()
    .onError(({ code, error, status }) => {
      switch (code) {
        case "PARSE":
          return status(400, { message: "Send a valid JSON body, then try again." });
        case "VALIDATION":
          if (error.type === "body") {
            return status(422, { message: "Choose a token available for collection." });
          }
        // Response validation failures fall through to the server error response.
        default:
          console.error(error);
          return status(500, { message: "Couldn't load or save your settings. Try again." });
      }
    })
    .get(
      "/merchant-settings",
      async ({ request, status }) => {
        const session = await sessions.read(request.headers);
        if (!session) return status(401, { message: "Sign in to view your settings." });

        const settings = await repository.findByMerchantId(session.userId);
        return { defaultTokenAddress: settings?.defaultTokenAddress ?? null };
      },
      { response: { 200: settingsSchema, 401: errorSchema, 500: errorSchema } },
    )
    .put(
      "/merchant-settings",
      async ({ body, request, status }) => {
        const session = await sessions.read(request.headers);
        if (!session) return status(401, { message: "Sign in to update your settings." });

        const { defaultTokenAddress } = await repository.save({
          merchantId: session.userId,
          defaultTokenAddress: body.defaultTokenAddress,
        });
        return { defaultTokenAddress };
      },
      {
        body: merchantSettingsInputSchema,
        response: {
          200: settingsSchema,
          400: errorSchema,
          401: errorSchema,
          422: errorSchema,
          500: errorSchema,
        },
      },
    );
}
