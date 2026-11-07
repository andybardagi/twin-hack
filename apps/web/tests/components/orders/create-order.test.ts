import { keccak256, toHex, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { afterEach, expect, test, vi } from "vitest";

import type { Order } from "@workspace/payments/typed-data";

import { createOrder, CreateOrderError } from "@/components/orders/create-order";
import { orderIdToBytes32 } from "@/src/helpers/order-id";
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
const merchant = privateKeyToAccount(keccak256(toHex("create-order-merchant"))).address;
const reserved = {
  id,
  merchant,
  receiveToken: token.address,
  receiveAmount: "12340000",
  expiry: 1_800_000_000,
  feeBps: 50,
};
const signature: Hex = `0x${"ab".repeat(65)}`;
const sign = vi.fn(async (_order: Order) => signature);

afterEach(() => {
  fetchMock.mockReset();
  sign.mockClear();
});

test("reserves, signs exactly the reserved order, then attaches the signature", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(reserved, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ id }));
  await expect(createOrder(input, sign)).resolves.toEqual({ id });

  const [reserveUrl, reserveOptions] = fetchMock.mock.calls[0]!;
  expect(reserveUrl).toBe("/api/orders");
  expect(reserveOptions?.method).toBe("POST");
  expect(JSON.parse(String(reserveOptions?.body))).toEqual({
    tokenAddress: token.address,
    amount: "12.34",
  });
  expect(sign.mock.calls[0]?.[0]).toEqual({
    merchant,
    receiveToken: token.address,
    receiveAmount: 12_340_000n,
    orderId: orderIdToBytes32(id),
    expiry: 1_800_000_000n,
    feeBps: 50,
  });
  const [attachUrl, attachOptions] = fetchMock.mock.calls[1]!;
  expect(attachUrl).toBe(`/api/orders/${id}/signature`);
  expect(attachOptions?.method).toBe("POST");
  expect(JSON.parse(String(attachOptions?.body))).toEqual({ signature });
});

test.each([
  { ...input, amount: "0" },
  { ...input, amount: "1.234" },
  { ...input, tokenAddress: "invalid" },
  { tokenAddress: peso.address, amount: "1.1" },
])("rejects invalid form input before making a request: %j", async (value) => {
  await expect(createOrder(value, sign)).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("preserves a 401 for the form to send the merchant to sign-in", async () => {
  fetchMock.mockResolvedValue(Response.json({ message: "Sign in" }, { status: 401 }));
  await expect(createOrder(input, sign)).rejects.toMatchObject({ status: 401 });
});

test.each([400, 422, 500, 503])(
  "fails on reserve HTTP %i so the merchant can retry",
  async (status) => {
    fetchMock.mockResolvedValue(Response.json({ message: "Internal detail" }, { status }));
    const request = createOrder(input, sign);
    await expect(request).rejects.toBeInstanceOf(CreateOrderError);
    await expect(request).rejects.toThrow("Couldn't create the order");
    expect(sign).not.toHaveBeenCalled();
  },
);

test.each([409, 422, 503])("fails on attach HTTP %i instead of navigating", async (status) => {
  fetchMock
    .mockResolvedValueOnce(Response.json(reserved, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ message: "Internal detail" }, { status }));
  await expect(createOrder(input, sign)).rejects.toBeInstanceOf(CreateOrderError);
});

test("a signing failure stops before attaching", async () => {
  fetchMock.mockResolvedValueOnce(Response.json(reserved, { status: 201 }));
  sign.mockRejectedValueOnce(new Error("Device key unavailable"));
  await expect(createOrder(input, sign)).rejects.toThrow("Device key unavailable");
  expect(fetchMock).toHaveBeenCalledOnce();
});

test("a network failure rejects so the form can offer a retry", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(createOrder(input, sign)).rejects.toThrow();
});

test("rejects an invalid reservation instead of signing it", async () => {
  fetchMock.mockResolvedValue(Response.json({ ...reserved, id: "not-an-order" }, { status: 201 }));
  await expect(createOrder(input, sign)).rejects.toThrow();
  expect(sign).not.toHaveBeenCalled();
});
