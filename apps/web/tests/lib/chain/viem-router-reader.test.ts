import { zeroAddress } from "viem";
import { afterEach, expect, test, vi } from "vitest";

import { tokens } from "@workspace/payments/tokens";

import {
  DEFAULT_ARBITRUM_RPC_URL,
  DEFAULT_PAYMENT_ROUTER_ADDRESS,
  getChainConfig,
} from "@/lib/chain/chain-config";
import { getRouterReader } from "@/lib/chain/viem-router-reader";

afterEach(() => vi.unstubAllEnvs());

test("defaults to the deployed router and public RPC, and env overrides win", () => {
  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", undefined);
  vi.stubEnv("ARBITRUM_RPC_URL", undefined);
  expect(getChainConfig()).toEqual({
    routerAddress: "0x4DE32c75eecDF3229114F105293698284b261Bb1",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
  });
  expect(getRouterReader().routerAddress).toBe(DEFAULT_PAYMENT_ROUTER_ADDRESS);

  vi.stubEnv("PAYMENT_ROUTER_ADDRESS", tokens.USDT0.address.toLowerCase());
  expect(getChainConfig()).toEqual({
    routerAddress: tokens.USDT0.address,
    rpcUrl: DEFAULT_ARBITRUM_RPC_URL,
  });
  vi.stubEnv("ARBITRUM_RPC_URL", "http://127.0.0.1:1");
  expect(getChainConfig()).toEqual({
    routerAddress: tokens.USDT0.address,
    rpcUrl: "http://127.0.0.1:1",
  });
});

test("invalid overrides fail explicitly", () => {
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
  const { reader } = getRouterReader();
  await Promise.all([
    expect(reader.signingKeyOf(zeroAddress)).rejects.toThrow(),
    expect(reader.feeBps()).rejects.toThrow(),
    expect(reader.paid(zeroAddress, `0x${"0".repeat(64)}`)).rejects.toThrow(),
  ]);
});
