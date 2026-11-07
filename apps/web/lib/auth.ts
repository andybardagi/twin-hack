import { betterAuth, type Auth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { generateRandomString } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { siwe } from "better-auth/plugins";
import { v7 } from "uuid";
import { createPublicClient, http, isAddress, isHex, verifyMessage } from "viem";
import { arbitrum } from "viem/chains";
import { z } from "zod";

import { getDb } from "@/lib/db/client";

const environmentSchema = z.object({
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  ARBITRUM_RPC_URL: z.url(),
});

type AuthOptions = BetterAuthOptions & {
  plugins: [ReturnType<typeof siwe>, ReturnType<typeof nextCookies>];
};
type AuthInstance = Auth<AuthOptions>;

function createAuth(): AuthInstance {
  const environment = environmentSchema.parse(process.env);
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(environment.ARBITRUM_RPC_URL, { retryCount: 0 }),
  });

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
            if (await verifyMessage(parameters)) return true;
          } catch {
            // Non-EOA signatures throw here; try smart wallet verification over RPC.
          }

          try {
            return await publicClient.verifyMessage(parameters);
          } catch (error) {
            console.error("SIWE RPC signature verification failed", error);
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
