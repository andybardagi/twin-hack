import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Fork tests pull state from a remote RPC on first touch.
    testTimeout: 120_000,
    hookTimeout: 180_000,
  },
});
