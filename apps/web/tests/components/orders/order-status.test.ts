import { afterEach, expect, test, vi } from "vitest";

import {
  orderStatusPollInterval,
  OrderStatusError,
  readOrderStatus,
} from "@/components/orders/order-status";

const { fetchMock } = vi.hoisted(() => {
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock };
});

const id = "0195cb2e-b942-7d90-b22f-2dc4ebd88c81";

afterEach(() => fetchMock.mockReset());

test("reads the order status from the same-origin API", async () => {
  fetchMock.mockResolvedValue(Response.json({ status: "paid" }));
  await expect(readOrderStatus(id)).resolves.toBe("paid");
  expect(fetchMock.mock.calls[0]?.[0]).toBe(`/api/orders/${id}/status`);
});

test.each([401, 404, 500, 503])("surfaces HTTP %i for the retry state", async (status) => {
  fetchMock.mockResolvedValue(Response.json({ message: "Internal detail" }, { status }));
  const error = await readOrderStatus(id).catch((error: unknown) => error);
  expect(error).toBeInstanceOf(OrderStatusError);
  expect(error).toMatchObject({ status });
});

test("rejects an unknown status instead of showing it", async () => {
  fetchMock.mockResolvedValue(Response.json({ status: "refunded" }));
  await expect(readOrderStatus(id)).rejects.toThrow();
});

test("polls every 3 seconds until the order is paid or expired", () => {
  expect(orderStatusPollInterval(undefined)).toBe(3000);
  expect(orderStatusPollInterval("open")).toBe(3000);
  expect(orderStatusPollInterval("paid")).toBe(false);
  expect(orderStatusPollInterval("expired")).toBe(false);
});
