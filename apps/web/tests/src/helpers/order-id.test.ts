import { v7 } from "uuid";
import { expect, test } from "vitest";

import { bytes32ToOrderId, orderIdToBytes32 } from "@/src/helpers/order-id";

test("left-pads the UUID's 16 bytes and reverses it without losing leading zeros", () => {
  const uuid = "019a56a0-1234-7000-8000-123456789abc";
  expect(orderIdToBytes32(uuid)).toBe(
    "0x00000000000000000000000000000000019a56a0123470008000123456789abc",
  );
  for (const id of [uuid, v7(), uuid.toUpperCase()]) {
    expect(bytes32ToOrderId(orderIdToBytes32(id))).toBe(id.toLowerCase());
  }
});

test("rejects invalid UUIDs and noncanonical bytes32 values", () => {
  expect(() => orderIdToBytes32("not-a-uuid")).toThrow();
  for (const value of [
    "0x1234",
    `0x1${"0".repeat(63)}`,
    `0x${"g".repeat(64)}`,
    `0x${"0".repeat(32)}019a56a0123400008000123456789abc`,
  ]) {
    expect(() => bytes32ToOrderId(value)).toThrow();
  }
});
