import { parse, stringify } from "uuid";
import { bytesToHex, hexToBytes, padHex, type Hex } from "viem";

export function orderIdToBytes32(orderId: string): Hex {
  return padHex(bytesToHex(parse(orderId)), { size: 32 });
}

export function bytes32ToOrderId(orderId: string): string {
  if (!/^0x0{32}[0-9a-fA-F]{32}$/.test(orderId)) {
    throw new Error("Order ID must be a UUID left-padded to bytes32.");
  }
  // The validated bytes32 has a zero prefix; the remaining 16 bytes are the UUID.
  return stringify(hexToBytes(`0x${orderId.slice(34)}`));
}
