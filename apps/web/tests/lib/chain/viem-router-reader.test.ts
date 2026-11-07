import { zeroAddress } from "viem";
import { afterEach, expect, test, vi } from "vitest";

import { assertNever } from "@workspace/payments/assert-never";
import { tokens } from "@workspace/payments/tokens";

import { getChainConfig } from "@/lib/chain/chain-config";
import { getRouterReader } from "@/lib/chain/viem-router-reader";

afterEach(() => vi.unstubAllEnvs());

test("missing configuration is explicit and checked at runtime", () => {
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", undefined);
  vi.stubEnv("ARBITRUM_RPC_URL", undefined);
  expect(getRouterReader()).toEqual({ status: "not-configured" });
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", tokens.USDT0.address);
  expect(getRouterReader()).toEqual({ status: "not-configured" });
  vi.stubEnv("ARBITRUM_RPC_URL", "http://127.0.0.1:1");
  expect(getChainConfig()).toEqual({
    status: "configured",
    routerAddress: tokens.USDT0.address,
    rpcUrl: "http://127.0.0.1:1",
  });
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", undefined);
  expect(getRouterReader()).toEqual({ status: "not-configured" });
});

test("invalid configuration fails explicitly", () => {
  vi.stubEnv("ARBITRUM_RPC_URL", "https://example.com");
  for (const address of ["invalid", zeroAddress]) {
    vi.stubEnv("PAYMENT_ROUTER_ADDRESS", address);
    expect(() => getRouterReader()).toThrow("PAYMENT_ROUTER_ADDRESS");
  }
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", tokens.USDT0.address);
  vi.stubEnv("ARBITRUM_RPC_URL", "file:///tmp/rpc");
  expect(() => getRouterReader()).toThrow("ARBITRUM_RPC_URL");
});

test("RPC failures reject every read instead of returning a successful value", async () => {
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", tokens.USDT0.address);
  vi.stubEnv("ARBITRUM_RPC_URL", "http://127.0.0.1:1");
  const result = getRouterReader();
  switch (result.status) {
    case "not-configured":
      throw new Error("Expected configured reader");
    case "configured":
      await Promise.all([
        expect(result.reader.signingKeyOf(zeroAddress)).rejects.toThrow(),
        expect(result.reader.feeBps()).rejects.toThrow(),
        expect(result.reader.paid(zeroAddress, `0x${"0".repeat(64)}`)).rejects.toThrow(),
      ]);
      break;
    default:
      assertNever(result);
  }
});
