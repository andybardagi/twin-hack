import { afterEach, expect, test, vi } from "vitest";

import { signOut } from "@/components/auth/sign-out";

const { fetchMock } = vi.hoisted(() => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
});

afterEach(() => fetchMock.mockReset());

test("sign out succeeds after the server clears the session", async () => {
  fetchMock.mockResolvedValue(Response.json({ success: true }));
  await expect(signOut()).resolves.toBeUndefined();
});

test("a returned auth error fails the mutation instead of navigating", async () => {
  fetchMock.mockResolvedValue(Response.json({ message: "Internal detail" }, { status: 500 }));
  await expect(signOut()).rejects.toThrow("Sign-out failed");
});

test("a network failure fails the mutation so the user can retry", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(signOut()).rejects.toThrow();
});
