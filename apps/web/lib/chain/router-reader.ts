import type { Address, Hex } from "viem";

export interface RouterReader {
  signingKeyOf(merchant: Address): Promise<Address>;
  feeBps(): Promise<number>;
  paid(merchant: Address, orderId: Hex): Promise<boolean>;
}

export type RouterReaderResult =
  | { status: "not-configured" }
  | { status: "configured"; routerAddress: Address; reader: RouterReader };
