import { createWalletClient, custom, isAddressEqual, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { z } from "zod";

import { signOrder, type Order, type RouterDomain } from "@workspace/payments/typed-data";

import { createWrappingKey, unwrapPrivateKey, wrapPrivateKey } from "@/lib/signing-key/key-crypto";

const wrappedKeySchema = z.object({
  iv: z.instanceof(Uint8Array).transform((iv) => Uint8Array.from(iv)),
  ciphertext: z.instanceof(ArrayBuffer),
});
const storedKeySchema = z.object({
  wrappingKey: z.custom<CryptoKey>(
    (key) => key instanceof CryptoKey && !key.extractable && key.algorithm.name === "AES-GCM",
  ),
  current: wrappedKeySchema.nullable(),
  pending: wrappedKeySchema.nullable(),
});
type WrappedKey = z.infer<typeof wrappedKeySchema>;
type StoredKey = z.infer<typeof storedKeySchema>;

/** Carries a message that is safe to show the merchant. */
export class DeviceKeyError extends Error {}

/** The stored key is corrupt or undecryptable, so only registering a new one recovers. */
export class DeviceKeyUnreadableError extends DeviceKeyError {
  constructor() {
    super("This device’s signing key can’t be read. Register a new key to create orders here.");
  }
}

export function parseStoredKey(stored: unknown): StoredKey | undefined {
  if (stored === undefined) return undefined;
  const parsed = storedKeySchema.safeParse(stored);
  if (!parsed.success) throw new DeviceKeyUnreadableError();
  return parsed.data;
}

async function readAccount(wrappingKey: CryptoKey, wrapped: WrappedKey) {
  try {
    return privateKeyToAccount(await unwrapPrivateKey(wrappingKey, wrapped));
  } catch {
    throw new DeviceKeyUnreadableError();
  }
}

export async function resolveDeviceKey(
  record: StoredKey,
  onChain: Address,
): Promise<{ address: Address | null; promote: boolean }> {
  if (record.pending) {
    const { address } = await readAccount(record.wrappingKey, record.pending);
    if (isAddressEqual(address, onChain)) return { address, promote: true };
  }
  if (!record.current) return { address: null, promote: false };
  const { address } = await readAccount(record.wrappingKey, record.current);
  return { address, promote: false };
}

async function keepIfReadable(wrappingKey: CryptoKey, wrapped: WrappedKey | null) {
  if (!wrapped) return null;
  return (await readAccount(wrappingKey, wrapped).catch(() => null)) ? wrapped : null;
}

/** Keeps what still decrypts, so a corrupt pending key can't take a good current key with it. */
export async function recordWithPendingKey(
  stored: unknown,
): Promise<StoredKey & { pending: WrappedKey }> {
  const parsed = storedKeySchema.safeParse(stored);
  const record = parsed.success ? parsed.data : null;
  const current = record && (await keepIfReadable(record.wrappingKey, record.current));
  const pending = record && (await keepIfReadable(record.wrappingKey, record.pending));
  if (record && pending) return { ...record, current, pending };
  const wrappingKey = record && current ? record.wrappingKey : await createWrappingKey();
  return {
    wrappingKey,
    current,
    pending: await wrapPrivateKey(wrappingKey, generatePrivateKey()),
  };
}

async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("payment-device-keys", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("keys");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new DeviceKeyError(
          "Couldn’t open device key storage. Enable browser storage and try again.",
        ),
      );
    request.onblocked = () => reject(new DeviceKeyError("Close other tabs and try again."));
  });
}

async function readStored(db: IDBDatabase, merchant: Address): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = db.transaction("keys").objectStore("keys").get(merchant.toLowerCase());
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new DeviceKeyError("Couldn’t read the device key. Try again."));
  });
}

async function writeRecord(db: IDBDatabase, merchant: Address, record: StoredKey) {
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("keys", "readwrite");
    transaction.objectStore("keys").put(record, merchant.toLowerCase());
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(
        new DeviceKeyError("Couldn’t save the device key. Enable browser storage and try again."),
      );
    transaction.onerror = () =>
      reject(new DeviceKeyError("Couldn’t save the device key. Try again."));
  });
}

async function withStored<T>(
  merchant: Address,
  action: (db: IDBDatabase, stored: unknown) => Promise<T>,
) {
  return navigator.locks.request(`payment-device-key:${merchant.toLowerCase()}`, async () => {
    const db = await database();
    try {
      return await action(db, await readStored(db, merchant));
    } finally {
      db.close();
    }
  });
}

export async function getDeviceSigner(
  merchant: Address,
  onChain: Address,
): Promise<ReturnType<typeof deviceSigner> | null> {
  return withStored(merchant, async (db, stored) => {
    const record = parseStoredKey(stored);
    if (!record) return null;
    const { address, promote } = await resolveDeviceKey(record, onChain);
    if (promote)
      await writeRecord(db, merchant, { ...record, current: record.pending, pending: null });
    return address ? deviceSigner(merchant, address) : null;
  });
}

export async function prepareDeviceKey(merchant: Address): Promise<Address> {
  return withStored(merchant, async (db, stored) => {
    const record = await recordWithPendingKey(stored);
    await writeRecord(db, merchant, record);
    return (await readAccount(record.wrappingKey, record.pending)).address;
  });
}

async function signDeviceOrder(
  merchant: Address,
  onChain: Address,
  domain: RouterDomain,
  order: Order,
): Promise<Hex> {
  return withStored(merchant, async (_db, stored) => {
    const record = parseStoredKey(stored);
    if (!record || !isAddressEqual(merchant, order.merchant))
      throw new DeviceKeyError("Register this device before creating an order.");
    for (const wrapped of [record.current, record.pending]) {
      if (!wrapped) continue;
      const account = await readAccount(record.wrappingKey, wrapped);
      if (!isAddressEqual(account.address, onChain)) continue;
      const signer = createWalletClient({
        account,
        chain: arbitrum,
        transport: custom({
          request: async () => {
            throw new Error("Device signing cannot use the network");
          },
        }),
      });
      return signOrder(signer, domain, order);
    }
    throw new DeviceKeyError("Register this device before creating an order.");
  });
}

function deviceSigner(merchant: Address, address: Address) {
  return {
    address,
    signOrder: (domain: RouterDomain, order: Order) =>
      signDeviceOrder(merchant, address, domain, order),
  };
}
