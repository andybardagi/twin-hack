import { zeroAddress } from "viem";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  DeviceKeyUnreadableError,
  parseStoredKey,
  recordWithPendingKey,
  resolveDeviceKey,
} from "@/lib/signing-key/device-key";
import { createWrappingKey, unwrapPrivateKey, wrapPrivateKey } from "@/lib/signing-key/key-crypto";

const onChain = "0x2222222222222222222222222222222222222222";

async function wrappedKey(wrappingKey: CryptoKey) {
  const privateKey = generatePrivateKey();
  return {
    address: privateKeyToAddress(privateKey),
    wrapped: await wrapPrivateKey(wrappingKey, privateKey),
  };
}

async function corruptKey() {
  return (await wrappedKey(await createWrappingKey())).wrapped;
}

describe("resolveDeviceKey", () => {
  it("ignores a pending key that never reached the chain", async () => {
    const wrappingKey = await createWrappingKey();
    const { wrapped } = await wrappedKey(wrappingKey);
    await expect(
      resolveDeviceKey({ wrappingKey, current: null, pending: wrapped }, zeroAddress),
    ).resolves.toEqual({ address: null, promote: false });
  });

  it("promotes a pending key once it is on chain", async () => {
    const wrappingKey = await createWrappingKey();
    const { address, wrapped } = await wrappedKey(wrappingKey);
    await expect(
      resolveDeviceKey({ wrappingKey, current: null, pending: wrapped }, address),
    ).resolves.toEqual({ address, promote: true });
  });

  it("reports the current key while a rotation is pending", async () => {
    const wrappingKey = await createWrappingKey();
    const current = await wrappedKey(wrappingKey);
    const pending = await wrappedKey(wrappingKey);
    await expect(
      resolveDeviceKey(
        { wrappingKey, current: current.wrapped, pending: pending.wrapped },
        current.address,
      ),
    ).resolves.toEqual({ address: current.address, promote: false });
  });

  it("flags a key that can't be decrypted", async () => {
    const wrappingKey = await createWrappingKey();
    await expect(
      resolveDeviceKey({ wrappingKey, current: await corruptKey(), pending: null }, onChain),
    ).rejects.toBeInstanceOf(DeviceKeyUnreadableError);
  });
});

describe("parseStoredKey", () => {
  it("treats a missing record as no key and a malformed one as unreadable", () => {
    expect(parseStoredKey(undefined)).toBeUndefined();
    expect(() => parseStoredKey({ current: "garbage" })).toThrow(DeviceKeyUnreadableError);
  });
});

describe("recordWithPendingKey", () => {
  it("creates a record when nothing is stored", async () => {
    const record = await recordWithPendingKey(undefined);
    expect(record.current).toBeNull();
    await expect(unwrapPrivateKey(record.wrappingKey, record.pending)).resolves.toMatch(/^0x/);
  });

  it("replaces a malformed record with a fresh one", async () => {
    const record = await recordWithPendingKey({ wrappingKey: "garbage", current: 1 });
    expect(record.current).toBeNull();
    await expect(unwrapPrivateKey(record.wrappingKey, record.pending)).resolves.toMatch(/^0x/);
  });

  it("replaces a record whose keys can't be decrypted, including its wrapping key", async () => {
    const wrappingKey = await createWrappingKey();
    const record = await recordWithPendingKey({
      wrappingKey,
      current: await corruptKey(),
      pending: await corruptKey(),
    });
    expect(record.wrappingKey).not.toBe(wrappingKey);
    expect(record.current).toBeNull();
    await expect(unwrapPrivateKey(record.wrappingKey, record.pending)).resolves.toMatch(/^0x/);
  });

  it("keeps a readable current key when only the pending key is corrupt", async () => {
    const wrappingKey = await createWrappingKey();
    const current = await wrappedKey(wrappingKey);
    const record = await recordWithPendingKey({
      wrappingKey,
      current: current.wrapped,
      pending: await corruptKey(),
    });
    expect(record.wrappingKey).toBe(wrappingKey);
    expect(record.current).toEqual(current.wrapped);
    await expect(unwrapPrivateKey(wrappingKey, record.pending)).resolves.toMatch(/^0x/);
  });

  it("reuses a readable pending key so a retried registration signs with the same key", async () => {
    const wrappingKey = await createWrappingKey();
    const pending = await wrappedKey(wrappingKey);
    const record = await recordWithPendingKey({
      wrappingKey,
      current: null,
      pending: pending.wrapped,
    });
    expect(record.wrappingKey).toBe(wrappingKey);
    expect(record.pending).toEqual(pending.wrapped);
  });
});
