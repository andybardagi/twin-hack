import { zeroAddress, type Address } from "viem";
import { expect, it } from "vitest";
import { deriveKeyState } from "@/lib/signing-key/key-state";
const device: Address = "0x1234567890123456789012345678901234567890";
const other: Address = "0x2222222222222222222222222222222222222222";
it.each([
  [zeroAddress, null, "none"],
  [device, device, "registered-here"],
  [other, device, "registered-elsewhere"],
  [other, null, "registered-elsewhere"],
  [zeroAddress, device, "revoked"],
] as const)("derives state for chain %s and device %s", (chain, local, state) => {
  expect(deriveKeyState(chain, local)).toBe(state);
});
