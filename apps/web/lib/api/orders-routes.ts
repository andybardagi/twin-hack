import { Elysia } from "elysia";
import { getAddress } from "viem";
import { z } from "zod";

import { readRouter, type RouterSource } from "@/lib/chain/read-router";
import type { OrderRepository } from "@/lib/orders/order-repository";
import { isSignedByMerchantKey } from "@/lib/orders/order-signature";
import { settleOrder } from "@/lib/orders/order-settlement";
import { reservationExpiresAt, toReservedOrder } from "@/lib/orders/reserved-order";
import type { SessionReader } from "@/lib/session/session-reader";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";
import { orderIdToBytes32 } from "@/src/helpers/order-id";
import {
  orderInputSchema,
  orderSignatureSchema,
  orderStatusSchema,
  reservedOrderSchema,
  toSignableOrder,
} from "@/src/helpers/order-schema";

const errorSchema = z.object({ message: z.string() });
const chainUnavailable = { message: "Couldn't reach Arbitrum. Try again." };
const notSignable = { message: "This order can no longer be signed. Create a new order." };

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
        const valid = await readRouter(routerSource, (router) =>
          isSignedByMerchantKey(router, signed, body.signature),
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
    )
    .get(
      "/orders/:id/status",
      async ({ params, request, status }) => {
        const session = await sessions.read(request.headers);
        if (!session) return status(401, { message: "Sign in to check this order." });

        const order = await repository.findById(params.id);
        if (!order || order.merchantId !== session.userId) {
          return status(404, { message: "Order not found." });
        }

        const orderStatus = await settleOrder(order, repository, () =>
          readRouter(routerSource, ({ reader }) =>
            reader.paid(getAddress(order.merchantAddress), orderIdToBytes32(order.id)),
          ),
        );
        if (orderStatus === null) return status(503, chainUnavailable);
        return { status: orderStatus };
      },
      {
        response: {
          200: orderStatusSchema,
          401: errorSchema,
          404: errorSchema,
          500: errorSchema,
          503: errorSchema,
        },
        error({ error, status }) {
          console.error(error);
          return status(500, { message: "Couldn't check the payment status. Try again." });
        },
      },
    );
}
