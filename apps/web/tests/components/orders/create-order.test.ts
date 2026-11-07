import { afterEach, expect, test, vi } from "vitest";

import { createOrder, CreateOrderError } from "@/components/orders/create-order";
import { tokens } from "@/src/helpers/tokens";

const { fetchMock } = vi.hoisted(() => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
});

const token = tokens.find((token) => token.symbol === "USDT");
const peso = tokens.find((token) => token.symbol === "CHLt");
if (!token || !peso) throw new Error("Missing collectable tokens");
const input = { tokenAddress: token.address.toLowerCase(), amount: "12.34" };
const id = "0195cb2e-b942-7d90-b22f-2dc4ebd88c81";

afterEach(() => fetchMock.mockReset());

test("returns the created order and sends decimal input to the same-origin API", async () => {
  fetchMock.mockResolvedValue(Response.json({ id }, { status: 201 }));
  await expect(createOrder(input)).resolves.toEqual({ id });
  const [url, options] = fetchMock.mock.calls[0]!;
  expect(url).toBe("/api/orders");
  expect(options?.method).toBe("POST");
  expect(JSON.parse(String(options?.body))).toEqual({
    tokenAddress: token.address,
    amount: "12.34",
  });
});

test.each([
  { ...input, amount: "0" },
  { ...input, amount: "1.234" },
  { ...input, tokenAddress: "invalid" },
  { tokenAddress: peso.address, amount: "1.1" },
])("rejects invalid form input before making a request: %j", async (value) => {
  await expect(createOrder(value)).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("preserves a 401 for the form to send the merchant to sign-in", async () => {
  fetchMock.mockResolvedValue(Response.json({ message: "Sign in" }, { status: 401 }));
  await expect(createOrder(input)).rejects.toMatchObject({ status: 401 });
});

test.each([400, 422, 500])("fails on HTTP %i so the merchant can retry", async (status) => {
  fetchMock.mockResolvedValue(Response.json({ message: "Internal detail" }, { status }));
  const request = createOrder(input);
  await expect(request).rejects.toBeInstanceOf(CreateOrderError);
  await expect(request).rejects.toThrow("Couldn't create the order");
});

test("a network failure rejects so the form can offer a retry", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(createOrder(input)).rejects.toThrow();
});

test("rejects an invalid success response instead of navigating to an invalid order", async () => {
  fetchMock.mockResolvedValue(Response.json({ id: "not-an-order" }, { status: 201 }));
  await expect(createOrder(input)).rejects.toThrow();
});
