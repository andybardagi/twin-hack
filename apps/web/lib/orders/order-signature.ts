import {
  hexToBigInt,
  isAddressEqual,
  parseSignature,
  recoverAddress,
  type Address,
  type Hex,
} from "viem";
import { arbitrum } from "viem/chains";

import { hashOrder, type Order } from "@workspace/payments/typed-data";

import type { RouterReaderResult } from "@/lib/chain/router-reader";

// secp256k1 curve order n, halved. OpenZeppelin ECDSA rejects s above it.
const secp256k1HalfOrder = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;

/** Checks the signature against the merchant's current on-chain signing key; chain errors propagate. */
export async function isSignedByMerchantKey(
  { reader, routerAddress }: Extract<RouterReaderResult, { status: "configured" }>,
  order: Order,
  signature: Hex,
): Promise<boolean> {
  const signingKey = await reader.signingKeyOf(order.merchant);
  const hash = hashOrder({ chainId: arbitrum.id, router: routerAddress }, order);
  return isAcceptedSignature(signature) && (await recoversTo(hash, signature, signingKey));
}

// The router's OpenZeppelin ECDSA only accepts low-s signatures with v of 27 or 28.
function isAcceptedSignature(signature: Hex) {
  try {
    const { s, v } = parseSignature(signature);
    return hexToBigInt(s) <= secp256k1HalfOrder && (v === 27n || v === 28n);
  } catch {
    return false;
  }
}

async function recoversTo(hash: Hex, signature: Hex, signingKey: Address) {
  // viem throws when a signature recovers no key, which here is just a wrong signature.
  const signer = await recoverAddress({ hash, signature }).catch(() => null);
  return signer !== null && isAddressEqual(signer, signingKey);
}
