import { betterAuth, type Auth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateRandomString } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { siwe } from "better-auth/plugins";
import { v7 } from "uuid";
import { isAddress, isHex, verifyMessage } from "viem";
import { arbitrum } from "viem/chains";
import { z } from "zod";

import { getDb } from "@/lib/db/client";

const environmentSchema = z.object({
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
});

type AuthOptions = BetterAuthOptions & {
  plugins: [ReturnType<typeof siwe>, ReturnType<typeof nextCookies>];
};
type AuthInstance = Auth<AuthOptions>;

function createAuth(): AuthInstance {
  const environment = environmentSchema.parse(process.env);

  return betterAuth<AuthOptions>({
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), { provider: "pg" }),
    advanced: { database: { generateId: () => v7() } },
    plugins: [
      siwe({
        domain: new URL(environment.BETTER_AUTH_URL).host,
        anonymous: true,
        getNonce: async () => generateRandomString(32, "a-z", "A-Z", "0-9"),
        verifyMessage: async ({ message, signature, address, chainId }) => {
          if (chainId !== arbitrum.id) return false;
          if (!isHex(signature) || !isAddress(address, { strict: false })) return false;
          const parameters = {
            message,
            signature,
            address,
          };

          try {
            return await verifyMessage(parameters);
          } catch {
            // viem throws for malformed or contract-style signatures; reject sign-in.
            return false;
          }
        },
      }),
      nextCookies(),
    ],
  });
}

let auth: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  auth ??= createAuth();
  return auth;
}
