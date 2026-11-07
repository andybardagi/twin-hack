"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Hex } from "viem";
import type { z } from "zod";

import type { Order } from "@workspace/payments/typed-data";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select";

import { createOrder, CreateOrderError } from "@/components/orders/create-order";
import { DeviceKeyError } from "@/lib/signing-key/device-key";
import { orderInputSchema } from "@/src/helpers/order-schema";
import { tokens } from "@/src/helpers/tokens";

const collectableTokens = tokens.filter((token) => token.config.canCollect);

function CreateOrderForm({
  defaultTokenAddress,
  sign,
}: {
  defaultTokenAddress: string;
  sign: (order: Order) => Promise<Hex>;
}) {
  const router = useRouter();
  const defaultValues: z.input<typeof orderInputSchema> = {
    tokenAddress: defaultTokenAddress,
    amount: "",
  };
  const mutation = useMutation({
    mutationFn: (input: z.input<typeof orderInputSchema>) => createOrder(input, sign),
    retry: false,
    onSuccess: ({ id }) => router.push(`/orders/${id}`),
    onError: (error) => {
      if (error instanceof CreateOrderError && error.status === 401) {
        router.replace("/sign-in");
      }
    },
  });
  const form = useForm({
    defaultValues,
    validators: { onChange: orderInputSchema, onSubmit: orderInputSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => {
        // useMutation exposes the failure and handles session expiry in onError.
      });
    },
  });
  const busy = mutation.isPending || mutation.isSuccess;

  return (
    <form
      noValidate
      className="space-y-6"
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !form.state.isSubmitting) void form.handleSubmit();
      }}
    >
      <form.Field name="tokenAddress">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor="order-token">Token</FieldLabel>
            <NativeSelect
              id="order-token"
              name={field.name}
              className="w-full"
              value={field.state.value}
              disabled={busy}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby="order-token-error"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            >
              <NativeSelectOption value="">Choose a token</NativeSelectOption>
              {collectableTokens.map((token) => (
                <NativeSelectOption key={token.address} value={token.address}>
                  {token.symbol}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError id="order-token-error" errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.tokenAddress}>
        {(tokenAddress) => {
          const token = collectableTokens.find((token) => token.address === tokenAddress);
          return (
            <form.Field name="amount">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor="order-amount">Amount</FieldLabel>
                  <Input
                    id="order-amount"
                    name={field.name}
                    type="text"
                    inputMode={token?.fiatDecimals === 0 ? "numeric" : "decimal"}
                    value={field.state.value}
                    disabled={busy}
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby="order-amount-description order-amount-error"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldDescription id="order-amount-description">
                    {token
                      ? `Enter an amount in ${token.symbol} with up to ${token.fiatDecimals} decimal places.`
                      : "Choose a token to see the allowed decimal places."}
                  </FieldDescription>
                  <FieldError id="order-amount-error" errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          );
        }}
      </form.Subscribe>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error instanceof DeviceKeyError
            ? mutation.error.message
            : "Couldn’t create the order. Check the token, amount and your connection, then try again."}
        </p>
      )}
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" disabled={busy || isSubmitting}>
            {busy || isSubmitting ? "Creating order…" : "Create order"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

export { CreateOrderForm };
