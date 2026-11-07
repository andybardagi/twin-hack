import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { afterEach, expect, test, vi } from "vitest";
import { z } from "zod";

import { GET, PUT } from "@/app/api/[[...slugs]]/route";
import { merchantSettingsRoutes } from "@/lib/api/merchant-settings-routes";
import { getDb } from "@/lib/db/client";
import { merchantSettings, user, verification } from "@/lib/db/schema";
import { drizzleMerchantSettingsRepository } from "@/lib/merchant-settings/drizzle-merchant-settings-repository";
import { betterAuthSessionReader } from "@/lib/session/better-auth-session-reader";
import { tokens } from "@/src/helpers/tokens";
import { signInMerchant } from "./sign-in-merchant";

const url = "http://localhost:3000/api/merchant-settings";
const addresses: string[] = [];
const nonceIdentifiers: string[] = [];
const [firstToken, secondToken] = tokens;
if (!firstToken || !secondToken) throw new Error("Missing collectable tokens");
const signIn = () => signInMerchant(addresses, nonceIdentifiers);
const settingsResponseSchema = z.object({ defaultTokenAddress: z.string().nullable() }).strict();

function readRequest(cookie = "") {
  return new Request(url, { headers: { cookie } });
}

function saveRequest(body: unknown, cookie = "") {
  return new Request(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(body),
  });
}

async function readDefaultToken(cookie: string) {
  const response = await GET(readRequest(cookie));
  expect(response.status).toBe(200);
  return settingsResponseSchema.parse(await response.json()).defaultTokenAddress;
}

async function storedRow(merchantId: string) {
  return drizzleMerchantSettingsRepository.findByMerchantId(merchantId);
}

afterEach(async () => {
  vi.restoreAllMocks();
  const db = getDb();
  if (addresses.length) await db.delete(user).where(inArray(user.name, addresses));
  if (nonceIdentifiers.length) {
    await db.delete(verification).where(inArray(verification.identifier, nonceIdentifiers));
  }
  addresses.length = 0;
  nonceIdentifiers.length = 0;
});

test("sets, updates and reads the session merchant's default token, stored checksummed", async () => {
  const { merchantId, cookie } = await signIn();
  expect(await readDefaultToken(cookie)).toBeNull();

  const created = await PUT(
    saveRequest({ defaultTokenAddress: firstToken.address.toLowerCase() }, cookie),
  );
  expect(created.status).toBe(200);
  expect(await created.json()).toEqual({ defaultTokenAddress: firstToken.address });
  expect(await readDefaultToken(cookie)).toBe(firstToken.address);

  const updated = await PUT(saveRequest({ defaultTokenAddress: secondToken.address }, cookie));
  expect(updated.status).toBe(200);
  expect(await readDefaultToken(cookie)).toBe(secondToken.address);
  expect(
    await getDb()
      .select()
      .from(merchantSettings)
      .where(eq(merchantSettings.merchantId, merchantId)),
  ).toEqual([{ merchantId, defaultTokenAddress: secondToken.address }]);
});

test("keeps each merchant to their own row, ignoring a merchant id in the body", async () => {
  const owner = await signIn();
  const other = await signIn();
  await PUT(saveRequest({ defaultTokenAddress: firstToken.address }, owner.cookie));
  expect(await readDefaultToken(other.cookie)).toBeNull();

  const response = await PUT(
    saveRequest(
      { defaultTokenAddress: secondToken.address, merchantId: owner.merchantId },
      other.cookie,
    ),
  );
  expect(response.status).toBe(200);
  expect(await readDefaultToken(owner.cookie)).toBe(firstToken.address);
  expect(await readDefaultToken(other.cookie)).toBe(secondToken.address);
});

test("requires a valid session to read or save", async () => {
  for (const cookie of ["", "better-auth.session_token=invalid"]) {
    const read = await GET(readRequest(cookie));
    expect(read.status).toBe(401);
    expect(await read.json()).toEqual({ message: "Sign in to view your settings." });

    const save = await PUT(saveRequest({ defaultTokenAddress: firstToken.address }, cookie));
    expect(save.status).toBe(401);
    expect(await save.json()).toEqual({ message: "Sign in to update your settings." });
  }
});

test("rejects tokens that can't be collected with 422 without storing them", async () => {
  const { merchantId, cookie } = await signIn();
  for (const body of [
    {},
    { defaultTokenAddress: 1 },
    { defaultTokenAddress: "" },
    { defaultTokenAddress: "0x0000000000000000000000000000000000000000" },
  ]) {
    const response = await PUT(saveRequest(body, cookie));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "Choose a token available for collection." });
  }

  firstToken.config.canCollect = false;
  try {
    const response = await PUT(saveRequest({ defaultTokenAddress: firstToken.address }, cookie));
    expect(response.status).toBe(422);
  } finally {
    firstToken.config.canCollect = true;
  }
  expect(await storedRow(merchantId)).toBeNull();
});

test("rejects malformed JSON without exposing parser errors", async () => {
  const response = await PUT(
    new Request(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }),
  );
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ message: "Send a valid JSON body, then try again." });
});

test("returns a generic error when persistence fails", async () => {
  const { cookie } = await signIn();
  const error = new Error("Private database connection details");
  const logError = vi.spyOn(console, "error").mockImplementation(() => {});
  const app = new Elysia({ prefix: "/api" }).use(
    merchantSettingsRoutes(
      {
        async findByMerchantId() {
          throw error;
        },
        async save() {
          throw error;
        },
      },
      betterAuthSessionReader,
    ),
  );
  for (const request of [
    readRequest(cookie),
    saveRequest({ defaultTokenAddress: firstToken.address }, cookie),
  ]) {
    const response = await app.fetch(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Couldn't load or save your settings. Try again.",
    });
  }
  expect(logError).toHaveBeenCalledWith(error);
});
