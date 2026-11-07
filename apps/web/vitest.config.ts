import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://app:password@localhost:5433/app",
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-only-better-auth-secret-at-least-32-characters",
    },
  },
});
