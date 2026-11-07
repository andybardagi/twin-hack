import { Elysia } from "elysia";
import { z } from "zod";

import type { OrderRepository } from "@/lib/orders/order-repository";
import type { SessionReader } from "@/lib/session/session-reader";
import { orderInputSchema } from "@/src/helpers/order-schema";

const errorSchema = z.object({ message: z.string() });

export function ordersRoutes(repository: OrderRepository, sessions: SessionReader) {
  return new Elysia().post(
    "/orders",
    async ({ body, request, status }) => {
      const session = await sessions.read(request.headers);
      if (!session) return status(401, { message: "Sign in to create an order." });

      const order = await repository.create({ ...body, merchantId: session.userId });
      return status(201, { id: order.id });
    },
    {
      body: orderInputSchema,
      response: {
        201: z.object({ id: z.uuidv7() }),
        400: errorSchema,
        401: errorSchema,
        422: errorSchema,
        500: errorSchema,
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
  );
}
