import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  isAddressEqual,
  isHex,
  maxUint256,
  maxUint64,
  nonceManager,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import { z } from "zod";

import { assertNever } from "@workspace/payments/assert-never";
import { paymentRouterAddress } from "@workspace/payments/deployment";
import { relayPayment } from "@workspace/payments/relay";

import { getAuth } from "@/lib/auth";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";

const bytes32Pattern = /^0x[0-9a-fA-F]{64}$/;

const environmentSchema = z.object({
  RELAYER_PRIVATE_KEY: z.custom<Hex>(
    (value) => typeof value === "string" && bytes32Pattern.test(value),
    "RELAYER_PRIVATE_KEY must be a 0x-prefixed 32-byte hex private key",
  ),
  ARBITRUM_RPC_URL: z.url().default("https://arb1.arbitrum.io/rpc"),
});

const address = z.custom<Address>((value) => typeof value === "string" && isAddress(value));
const hex = z.custom<Hex>((value) => typeof value === "string" && isHex(value));
const bytes32 = z.custom<Hex>((value) => typeof value === "string" && bytes32Pattern.test(value));

function uint(max: bigint) {
  return z
    .string()
    .regex(/^\d+$/)
    .transform((value) => BigInt(value))
    .refine((value) => value <= max);
}

const requestSchema = z.object({
  order: z.object({
    merchant: address,
    receiveToken: address,
    receiveAmount: uint(maxUint256),
    orderId: bytes32,
    expiry: uint(maxUint64),
    feeBps: z.int().min(0).max(65_535),
  }),
  merchantSignature: hex,
  intent: z.object({
    payer: address,
    payToken: address,
    maxPayAmount: uint(maxUint256),
    orderHash: bytes32,
  }),
  payerSignature: hex,
  permit: z
    .object({
      value: uint(maxUint256),
      deadline: uint(maxUint256),
      v: z.int().min(0).max(255),
      r: bytes32,
      s: bytes32,
    })
    .optional(),
});

function createRelayer() {
  const environment = environmentSchema.parse(process.env);
  const transport = http(environment.ARBITRUM_RPC_URL);
  const account = privateKeyToAccount(environment.RELAYER_PRIVATE_KEY, { nonceManager });

  return {
    walletClient: createWalletClient({ account, chain: arbitrum, transport }),
    publicClient: createPublicClient({ chain: arbitrum, transport }),
  };
}

let relayer: ReturnType<typeof createRelayer> | undefined;

function getRelayer() {
  relayer ??= createRelayer();
  return relayer;
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    // A malformed body is a client error; the schema check below turns `undefined` into a 400.
    return undefined;
  }
}

/** Settles a signed payment from the session user's primary wallet, paying gas from the relayer account. */
export async function handleRelayRequest(request: Request): Promise<Response> {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Sign in to pay" }, { status: 401 });

  const body = requestSchema.safeParse(await readJson(request));
  if (!body.success) return Response.json({ error: "Invalid payment request" }, { status: 400 });

  const wallet = await getPrimaryWalletAddress(session.user.id);
  const isPayer =
    wallet !== null &&
    isAddress(wallet, { strict: false }) &&
    isAddressEqual(wallet, body.data.intent.payer);
  if (!isPayer) {
    return Response.json({ error: "Pay from the wallet you signed in with" }, { status: 403 });
  }

  const { walletClient, publicClient } = getRelayer();
  const result = await relayPayment(walletClient, publicClient, {
    router: paymentRouterAddress,
    ...body.data,
  });
  switch (result.kind) {
    case "settled": {
      const { settled } = result;
      return Response.json({
        hash: result.hash,
        settled: {
          ...settled,
          payAmount: settled.payAmount.toString(),
          receiveAmount: settled.receiveAmount.toString(),
          fee: settled.fee.toString(),
        },
      });
    }
    case "invalid-order":
      return Response.json({ error: result.reason }, { status: 422 });
    case "reverted":
      return Response.json({ error: result.errorName }, { status: 422 });
    default:
      return assertNever(result);
  }
}
