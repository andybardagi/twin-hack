export type KeypadKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "delete";

export type KeypadResult =
  | { status: "accepted"; amount: string }
  | { status: "rejected"; reason: "decimals" | "too-large" };

const MAX_WHOLE_DIGITS = 12;

/** Applies one key press to a typed amount, keeping it a valid decimal for the token. */
export function pressKey(amount: string, key: KeypadKey, fiatDecimals: number): KeypadResult {
  const [whole = "", fraction] = amount.split(".");
  switch (key) {
    case "delete":
      return { status: "accepted", amount: amount.slice(0, -1) };
    case ".":
      if (fiatDecimals === 0) return { status: "rejected", reason: "decimals" };
      return { status: "accepted", amount: fraction === undefined ? `${whole || "0"}.` : amount };
    default:
      if (fraction !== undefined) {
        if (fraction.length >= fiatDecimals) return { status: "rejected", reason: "decimals" };
        return { status: "accepted", amount: amount + key };
      }
      if (whole === "0" || whole === "")
        return { status: "accepted", amount: key === "0" ? "" : key };
      if (whole.length >= MAX_WHOLE_DIGITS) return { status: "rejected", reason: "too-large" };
      return { status: "accepted", amount: amount + key };
  }
}

/** Drops decimals a token can't hold, e.g. when switching to a zero-decimal token. */
export function fitDecimals(amount: string, fiatDecimals: number): string {
  const [whole = "", fraction] = amount.split(".");
  if (fraction === undefined) return amount;
  if (fiatDecimals === 0) return whole;
  return `${whole}.${fraction.slice(0, fiatDecimals)}`;
}

/** Groups thousands for display while keeping what the user typed after the point. */
export function formatTypedAmount(amount: string): string {
  const [whole = "", fraction] = amount.split(".");
  const grouped = BigInt(whole || "0").toLocaleString("en-US");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}
