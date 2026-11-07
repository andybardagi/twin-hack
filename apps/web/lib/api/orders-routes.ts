import { Elysia } from "elysia";
import {
  getAddress,
  hexToBigInt,
  isAddressEqual,
  parseSignature,
  recoverAddress,
  type Address,
  type Hex,
} from "viem";
import { arbitrum } from "viem/chains";
import { z } from "zod";

import { assertNever } from "@workspace/payments/assert-never";
import { hashOrder } from "@workspace/payments/typed-data";

import type { RouterReaderResult } from "@/lib/chain/router-reader";
import type { OrderRepository } from "@/lib/orders/order-repository";
import { reservationExpiresAt, toReservedOrder } from "@/lib/orders/reserved-order";
import type { SessionReader } from "@/lib/session/session-reader";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";
import {
  orderInputSchema,
  orderSignatureSchema,
  reservedOrderSchema,
  toSignableOrder,
} from "@/src/helpers/order-schema";

const errorSchema = z.object({ message: z.string() });
const chainUnavailable = { message: "Couldn't reach Arbitrum. Try again." };
const notSignable = { message: "This order can no longer be signed. Create a new order." };

type RouterSource = () => RouterReaderResult;

/** Resolves to null when the chain can't answer, so callers can never treat that as a pass. */
async function readRouter<T>(
  source: RouterSource,
  read: (router: Extract<RouterReaderResult, { status: "configured" }>) => Promise<T>,
): Promise<T | null> {
  const router = source();
  switch (router.status) {
    case "not-configured":
      return null;
    case "configured":
      try {
        return await read(router);
      } catch (error) {
        console.error(error);
        return null;
      }
    default:
      return assertNever(router);
  }
}

// secp256k1 curve order n, halved. OpenZeppelin ECDSA rejects s above it.
const secp256k1HalfOrder = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n;

async function isSignedBy(signingKey: Address, hash: Hex, signature: Hex) {
  // viem throws on a malformed signature or one that recovers no key: just a wrong signature.
  try {
    // The router's OpenZeppelin ECDSA only accepts low-s signatures with v of 27 or 28.
    const { s, v } = parseSignature(signature);
    if (hexToBigInt(s) > secp256k1HalfOrder || (v !== 27n && v !== 28n)) return false;
    return isAddressEqual(await recoverAddress({ hash, signature }), signingKey);
  } catch {
    return false;
  }
}

export function ordersRoutes(
  repository: OrderRepository,
  sessions: SessionReader,
  routerSource: RouterSource,
) {
  return new Elysia()
    .post(
      "/orders",
      async ({ body, request, status }) => {
        const session = await sessions.read(request.headers);
        if (!session) return status(401, { message: "Sign in to create an order." });

        const merchantAddress = await getPrimaryWalletAddress(session.userId);
        if (!merchantAddress) {
          return status(409, { message: "Your wallet couldn't be found. Sign in again." });
        }

        const feeBps = await readRouter(routerSource, ({ reader }) => reader.feeBps());
        if (feeBps === null) return status(503, chainUnavailable);

        const order = await repository.create({
          ...body,
          merchantId: session.userId,
          merchantAddress: getAddress(merchantAddress),
          expiresAt: reservationExpiresAt(new Date()),
          feeBps,
        });
        return status(201, toReservedOrder(order));
      },
      {
        body: orderInputSchema,
        response: {
          201: reservedOrderSchema,
          400: errorSchema,
          401: errorSchema,
          409: errorSchema,
          422: errorSchema,
          500: errorSchema,
          503: errorSchema,
        },
        error({ code, error, status }) {
          switch (code) {
            case "PARSE":
              return status(400, { message: "Send a valid JSON body, then try again." });
            case "VALIDATION":
              if (error.type === "body") {
                return status(422, { message: "Check the token and amount, then try again." });
              }
            // Response validation failures fall through to the server error response.
            default:
              console.error(error);
              return status(500, { message: "Couldn't create the order. Try again." });
          }
        },
      },
    )
    .post(
      "/orders/:id/signature",
      async ({ body, params, request, status }) => {
        const session = await sessions.read(request.headers);
        if (!session) return status(401, { message: "Sign in to sign an order." });

        const order = await repository.findForSigning(params.id, session.userId);
        if (!order) return status(404, { message: "Order not found." });
        if (order.signature || order.expiresAt <= new Date()) return status(409, notSignable);

        const signed = toSignableOrder(toReservedOrder(order));
        const valid = await readRouter(routerSource, async ({ reader, routerAddress }) =>
          isSignedBy(
            await reader.signingKeyOf(signed.merchant),
            hashOrder({ chainId: arbitrum.id, router: routerAddress }, signed),
            body.signature,
          ),
        );
        if (valid === null) return status(503, chainUnavailable);
        if (!valid) {
          return status(422, { message: "The signature doesn't match this order." });
        }

        const attached = await repository.attachSignature(order.id, body.signature);
        if (!attached) return status(409, notSignable);
        return { id: attached.id };
      },
      {
        body: orderSignatureSchema,
        response: {
          200: z.object({ id: z.uuidv7() }),
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          409: errorSchema,
          422: errorSchema,
          500: errorSchema,
          503: errorSchema,
        },
        error({ code, error, status }) {
          switch (code) {
            case "PARSE":
              return status(400, { message: "Send a valid JSON body, then try again." });
            case "VALIDATION":
              if (error.type === "body") {
                return status(422, { message: "The signature doesn't match this order." });
              }
            // Response validation failures fall through to the server error response.
            default:
              console.error(error);
              return status(500, { message: "Couldn't sign the order. Try again." });
          }
        },
      },
    );
}
