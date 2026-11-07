import { afterEach, expect, test, vi } from "vitest";

import {
  DefaultReceiveTokenError,
  readDefaultReceiveToken,
  saveDefaultReceiveToken,
} from "@/components/settings/default-receive-token";
import { tokens } from "@/src/helpers/tokens";

const { fetchMock } = vi.hoisted(() => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
});

const token = tokens[0];
if (!token) throw new Error("Missing collectable token");

afterEach(() => fetchMock.mockReset());

test("reads the saved token from the same-origin API", async () => {
  fetchMock.mockResolvedValue(Response.json({ defaultTokenAddress: token.address }));
  await expect(readDefaultReceiveToken()).resolves.toBe(token.address);
  expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/merchant-settings");
});

test("saves a collectable token with PUT", async () => {
  fetchMock.mockResolvedValue(Response.json({ defaultTokenAddress: token.address }));
  await saveDefaultReceiveToken({ defaultTokenAddress: token.address.toLowerCase() });
  const [url, options] = fetchMock.mock.calls[0]!;
  expect(url).toBe("/api/merchant-settings");
  expect(options?.method).toBe("PUT");
  expect(JSON.parse(String(options?.body))).toEqual({ defaultTokenAddress: token.address });
});

test("rejects an uncollectable token before making a request", async () => {
  await expect(saveDefaultReceiveToken({ defaultTokenAddress: "invalid" })).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("surfaces the response status so the form can handle session expiry", async () => {
  fetchMock.mockResolvedValue(Response.json({ message: "Sign in." }, { status: 401 }));
  const error = await saveDefaultReceiveToken({ defaultTokenAddress: token.address }).catch(
    (error: unknown) => error,
  );
  expect(error).toBeInstanceOf(DefaultReceiveTokenError);
  expect(error).toMatchObject({ status: 401 });
});
