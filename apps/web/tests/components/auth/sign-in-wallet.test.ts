import { parseSiweMessage } from "viem/siwe";
import { arbitrum, mainnet } from "viem/chains";
import { afterEach, expect, test, vi } from "vitest";
import { createConfig, createStorage, http } from "wagmi";
import { connect } from "wagmi/actions";
import { mock } from "wagmi/connectors";

import { getSignInMessage, signInWallet } from "@/components/auth/sign-in-wallet";

const { fetchMock } = vi.hoisted(() => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
});

const address = "0x0000000000000000000000000000000000000001";
const location = { host: "localhost:3000", origin: "http://localhost:3000" };
const nonce = "testnonce12345678";

function setup(features: Parameters<typeof mock>[0]["features"] = {}) {
  const items = new Map<string, string>();
  const config = createConfig({
    chains: [mainnet, arbitrum],
    connectors: [mock({ accounts: [address], features: { switchChainError: true, ...features } })],
    ssr: true,
    storage: createStorage({
      storage: {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => {
          items.set(key, value);
        },
        removeItem: (key) => {
          items.delete(key);
        },
      },
    }),
    multiInjectedProviderDiscovery: false,
    transports: { [mainnet.id]: http(), [arbitrum.id]: http() },
  });
  const connector = config.connectors[0];
  if (!connector) throw new Error("Missing test connector");
  return { config, connector };
}

afterEach(() => fetchMock.mockReset());

test("can sign in after remount clears a previously connected wallet", async () => {
  const { config, connector } = setup();
  await connect(config, { connector });

  // WagmiProvider with reconnectOnMount=false rehydrates, then clears connections.
  // Storage enables persist at runtime, but Wagmi's installed store type resolves to never.
  const store = config._internal.store as { persist: { rehydrate(): void | Promise<void> } };
  await store.persist.rehydrate();
  config.setState((state) => ({ ...state, connections: new Map() }));
  expect(config.state.current).toBe(connector.uid);
  expect(config.state.connections.size).toBe(0);

  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("/siwe/nonce")) return Response.json({ nonce });
    if (url.includes("/siwe/verify")) return Response.json({ success: true });
    const body = JSON.parse(String(init?.body));
    return Response.json({ jsonrpc: "2.0", id: body.id, result: `0x${"11".repeat(65)}` });
  });

  await expect(signInWallet(config, connector, location)).resolves.toBeUndefined();
  expect(config.state.connections.get(connector.uid)?.accounts).toEqual([address]);
});

test("signs an Arbitrum message on another wallet network and can retry a connected wallet", async () => {
  const { config, connector } = setup();
  const messages: string[] = [];
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("/siwe/nonce")) return Response.json({ nonce });
    const body = JSON.parse(String(init?.body));
    if (url.includes("/siwe/verify")) {
      messages.push(body.message);
      return Response.json({ success: true });
    }
    expect(body.method).toBe("eth_sign");
    return Response.json({ jsonrpc: "2.0", id: body.id, result: `0x${"11".repeat(65)}` });
  });

  await signInWallet(config, connector, location);
  await signInWallet(config, connector, location);
  expect(messages).toHaveLength(2);
  for (const message of messages) {
    expect(parseSiweMessage(message)).toMatchObject({
      address,
      chainId: arbitrum.id,
      domain: location.host,
      uri: location.origin,
      nonce,
      version: "1",
    });
  }
  expect(await connector.getChainId()).toBe(mainnet.id);
});

test.each(["connectError", "signMessageError"] as const)(
  "%s gives neutral cancellation copy",
  async (failure) => {
    const { config, connector } = setup({ [failure]: true });
    fetchMock.mockImplementation(async () => Response.json({ nonce }));
    const error = await signInWallet(config, connector, location).catch((error: unknown) => error);
    expect(getSignInMessage(error)).toContain("Sign-in canceled");
  },
);

test.each(["nonce", "verify"])("handles a returned %s API error", async (failure) => {
  const { config, connector } = setup();
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes(`/siwe/${failure}`)) {
      return Response.json({ message: "Internal detail", code: "UNAUTHORIZED" }, { status: 401 });
    }
    if (url.includes("/siwe/nonce")) return Response.json({ nonce });
    const body = JSON.parse(String(init?.body));
    return Response.json({ jsonrpc: "2.0", id: body.id, result: `0x${"11".repeat(65)}` });
  });
  const error = await signInWallet(config, connector, location).catch((error: unknown) => error);
  expect(getSignInMessage(error)).toContain(
    failure === "nonce" ? "Couldn’t start sign-in" : "Couldn’t verify",
  );
  expect(getSignInMessage(error)).not.toContain("Internal detail");
});

test("network failure gives actionable retry copy", async () => {
  const { config, connector } = setup();
  fetchMock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
  const error = await signInWallet(config, connector, location).catch((error: unknown) => error);
  expect(getSignInMessage(error)).toMatch(/Check your connection/);
});
