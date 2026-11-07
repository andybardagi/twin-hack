import { generatePrivateKey } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { createWrappingKey, wrapPrivateKey, unwrapPrivateKey } from "@/lib/signing-key/key-crypto";

describe("device key encryption", () => {
  it("round trips with a non-extractable AES key and fresh IVs", async () => {
    const key = await createWrappingKey();
    const privateKey = generatePrivateKey();
    const wrapped = await wrapPrivateKey(key, privateKey);
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toThrow();
    expect(await unwrapPrivateKey(key, wrapped)).toBe(privateKey);
    const second = await wrapPrivateKey(key, privateKey);
    expect(second.iv).not.toEqual(wrapped.iv);
    expect(new Uint8Array(second.ciphertext)).not.toEqual(new Uint8Array(wrapped.ciphertext));
  });
  it("rejects a different wrapping key and tampered ciphertext", async () => {
    const key = await createWrappingKey();
    const wrapped = await wrapPrivateKey(key, generatePrivateKey());
    await expect(unwrapPrivateKey(await createWrappingKey(), wrapped)).rejects.toThrow();
    new Uint8Array(wrapped.ciphertext).fill(0);
    await expect(unwrapPrivateKey(key, wrapped)).rejects.toThrow();
  });
});
