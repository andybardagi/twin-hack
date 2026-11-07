import { isAddressEqual, zeroAddress, type Address } from "viem";

export function deriveKeyState(
  onChain: Address,
  device: Address | null,
): "none" | "registered-here" | "registered-elsewhere" | "revoked" {
  if (isAddressEqual(onChain, zeroAddress)) return device ? "revoked" : "none";
  return device && isAddressEqual(onChain, device) ? "registered-here" : "registered-elsewhere";
}
