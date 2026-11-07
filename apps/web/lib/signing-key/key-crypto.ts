import { bytesToHex, hexToBytes, type Hex } from "viem";

export async function createWrappingKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function wrapPrivateKey(
  key: CryptoKey,
  privateKey: Hex,
): Promise<{ iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = Uint8Array.from(hexToBytes(privateKey));
  try {
    return { iv, ciphertext: await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext) };
  } finally {
    plaintext.fill(0);
  }
}

export async function unwrapPrivateKey(
  key: CryptoKey,
  wrapped: Awaited<ReturnType<typeof wrapPrivateKey>>,
): Promise<Hex> {
  const plaintext = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: wrapped.iv }, key, wrapped.ciphertext),
  );
  try {
    if (plaintext.length !== 32) throw new Error("Invalid device key");
    return bytesToHex(plaintext);
  } finally {
    plaintext.fill(0);
  }
}
