import { Elysia } from "elysia";
import { getAddress, isAddress, isHex } from "viem";
import { arbitrum } from "viem/chains";
import { z } from "zod";

import { assertNever } from "@workspace/payments/assert-never";
import { hashOrder } from "@workspace/payments/typed-data";
import type { InvalidOrderReason } from "@workspace/payments/verify-order";

import type { RouterSource } from "@/lib/chain/read-router";
import type { OrderRepository } from "@/lib/orders/order-repository";
import { toReservedOrder } from "@/lib/orders/reserved-order";
import type { PaymentRelayer } from "@/lib/payments/relay";
import type { SessionReader } from "@/lib/session/session-reader";
import { getPrimaryWalletAddress } from "@/lib/wallet-address";
import { toSignableOrder } from "@/src/helpers/order-schema";
import { payOrderInputSchema, payOrderResultSchema } from "@/src/helpers/pay-order-schema";

const errorSchema = z.object({ message: z.string() });

function invalidOrderMessage(reason: InvalidOrderReason): string {
  switch (reason) {
    case "no-signing-key":
    case "wrong-signer":
      return "This order isn't signed by the merchant's registered device. Don't pay it.";
    case "fee-changed":
      return "The fee changed after this order was created. Ask the merchant for a new one.";
    case "expired":
      return "This order has expired. Ask the merchant for a new one.";
    case "already-paid":
      return "This order has already been paid.";
    case "unsupported-token":
      return "This order's token isn't supported. Ask the merchant for a new one.";
    case "self-payment":
      return "You can't pay your own order. Sign in with a different wallet.";
    default:
      return assertNever(reason);
  }
}

function revertedMessage(errorName: string): string {
  switch (errorName) {
    case "MaxPayExceeded":
      return "The price moved past your limit. Nothing was charged. Try again for a fresh quote.";
    case "InvalidPayerSignature":
    case "OrderHashMismatch":
      return "Your payment signature didn't match this order. Nothing was charged. Try again.";
    default:
      return "The payment would fail, so nothing was sent. Check your balance, then try again.";
  }
}

/** Settles a signed order from the session user's wallet; the relayer pays the gas. */
export function payOrderRoutes(
  repository: OrderRepository,
  sessions: SessionReader,
  routerSource: RouterSource,
  relay: PaymentRelayer,
) {
  return new Elysia().post(
    "/orders/:id/pay",
    async ({ body, params, request, status }) => {
      const session = await sessions.read(request.headers);
      if (!session) return status(401, { message: "Sign in to pay." });

      const payer = await getPrimaryWalletAddress(session.userId);
      if (!payer || !isAddress(payer, { strict: false })) {
        return status(409, { message: "Your wallet couldn't be found. Sign in again." });
      }

      const stored = await repository.findById(params.id);
      if (!stored?.signature || !isHex(stored.signature)) {
        return status(404, { message: "Order not found." });
      }

      // The order and its hash come from the server, so the browser never sees the merchant address.
      const order = toSignableOrder(toReservedOrder(stored));
      const { routerAddress: router } = routerSource();
      const result = await relay({
        router,
        order,
        merchantSignature: stored.signature,
        intent: {
          payer: getAddress(payer),
          payToken: getAddress(body.payToken),
          maxPayAmount: BigInt(body.maxPayAmount),
          orderHash: hashOrder({ chainId: arbitrum.id, router }, order),
        },
        payerSignature: body.payerSignature,
        permit: body.permit && {
          ...body.permit,
          value: BigInt(body.permit.value),
          deadline: BigInt(body.permit.deadline),
        },
      });
      switch (result.kind) {
        case "settled":
          await repository.markSettled(stored.id, {
            payerAddress: getAddress(payer),
            txHash: result.hash,
          });
          return { hash: result.hash };
        case "invalid-order":
          return status(409, { message: invalidOrderMessage(result.reason) });
        case "reverted":
          return status(422, { message: revertedMessage(result.errorName) });
        default:
          return assertNever(result);
      }
    },
    {
      body: payOrderInputSchema,
      response: {
        200: payOrderResultSchema,
        400: errorSchema,
        401: errorSchema,
        404: errorSchema,
        409: errorSchema,
        422: errorSchema,
        500: errorSchema,
      },
      error({ code, error, status }) {
        switch (code) {
          case "PARSE":
            return status(400, { message: "Send a valid JSON body, then try again." });
          case "VALIDATION":
            if (error.type === "body") {
              return status(422, { message: "Check the payment details, then try again." });
            }
          // Response validation failures fall through to the server error response.
          default:
            console.error(error);
            return status(500, {
              message: "Couldn't send the payment. Nothing was charged. Try again.",
            });
        }
      },
    },
  );
}
