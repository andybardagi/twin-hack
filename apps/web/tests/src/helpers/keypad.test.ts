import { describe, expect, test } from "vitest";

import { fitDecimals, formatTypedAmount, pressKey, type KeypadKey } from "@/src/helpers/keypad";

function type(keys: KeypadKey[], fiatDecimals: number) {
  return keys.reduce(
    (state, key) => {
      const result = pressKey(state.amount, key, fiatDecimals);
      return result.status === "accepted"
        ? { amount: result.amount, rejected: state.rejected }
        : { amount: state.amount, rejected: [...state.rejected, result.reason] };
    },
    { amount: "", rejected: [] as string[] },
  );
}

describe("pressKey", () => {
  test("builds a decimal amount", () => {
    expect(type(["1", "2", ".", "5", "0"], 2)).toEqual({ amount: "12.50", rejected: [] });
  });

  test("starts with 0. when the point comes first", () => {
    expect(type([".", "5"], 2).amount).toBe("0.5");
  });

  test("ignores leading zeros", () => {
    expect(type(["0", "0", "7"], 2).amount).toBe("7");
  });

  test("rejects digits past the token's decimals", () => {
    expect(type(["1", ".", "2", "3", "4"], 2)).toEqual({ amount: "1.23", rejected: ["decimals"] });
  });

  test("rejects the point for zero-decimal tokens", () => {
    expect(type(["8", "9", "."], 0)).toEqual({ amount: "89", rejected: ["decimals"] });
  });

  test("ignores a second point", () => {
    expect(type(["1", ".", "."], 2).amount).toBe("1.");
  });

  test("rejects amounts past twelve whole digits", () => {
    const keys = Array.from({ length: 13 }, (): KeypadKey => "9");
    expect(type(keys, 2)).toEqual({ amount: "9".repeat(12), rejected: ["too-large"] });
  });

  test("deletes the last character", () => {
    expect(type(["1", ".", "5", "delete", "delete"], 2).amount).toBe("1");
  });
});

test("fitDecimals trims to what the token holds", () => {
  expect(fitDecimals("12.345", 2)).toBe("12.34");
  expect(fitDecimals("12.5", 0)).toBe("12");
  expect(fitDecimals("12", 2)).toBe("12");
});

test("formatTypedAmount groups thousands and keeps typed decimals", () => {
  expect(formatTypedAmount("")).toBe("0");
  expect(formatTypedAmount("12500.5")).toBe("12,500.5");
  expect(formatTypedAmount("1000.")).toBe("1,000.");
});
