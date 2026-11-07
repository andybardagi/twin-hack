"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select";

import {
  DefaultReceiveTokenError,
  readDefaultReceiveToken,
  saveDefaultReceiveToken,
} from "@/components/settings/default-receive-token";
import { merchantSettingsInputSchema } from "@/src/helpers/merchant-settings-schema";
import { tokens } from "@/src/helpers/tokens";

const collectableTokens = tokens.filter((token) => token.config.canCollect);
const queryKey = ["default-receive-token"];

function DefaultReceiveTokenForm({ savedTokenAddress }: { savedTokenAddress: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: saveDefaultReceiveToken,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => {
      if (error instanceof DefaultReceiveTokenError && error.status === 401) {
        router.replace("/sign-in");
      }
    },
  });
  const form = useForm({
    defaultValues: { defaultTokenAddress: savedTokenAddress ?? "" },
    validators: {
      onChange: merchantSettingsInputSchema,
      onSubmit: merchantSettingsInputSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value).catch(() => {
        // useMutation exposes the failure and handles session expiry in onError.
      });
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      aria-busy={mutation.isPending}
      onSubmit={(event) => {
        event.preventDefault();
        if (!mutation.isPending) void form.handleSubmit();
      }}
    >
      <form.Field name="defaultTokenAddress">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor="default-receive-token">Token</FieldLabel>
            <NativeSelect
              id="default-receive-token"
              name={field.name}
              className="w-full"
              value={field.state.value}
              disabled={mutation.isPending}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby="default-receive-token-description default-receive-token-error"
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
            <FieldDescription id="default-receive-token-description">
              The token you usually collect in.
            </FieldDescription>
            <FieldError id="default-receive-token-error" errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          Couldn’t save the default token. Check your connection, then try again.
        </p>
      )}
      {mutation.isSuccess && <p role="status">Default token saved.</p>}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save default token"}
      </Button>
    </form>
  );
}

export function DefaultReceiveTokenSettings() {
  const saved = useQuery({ queryKey, queryFn: readDefaultReceiveToken });
  if (saved.isPending) return <p role="status">Loading default token…</p>;
  if (saved.isError)
    return (
      <div role="alert" className="space-y-2">
        <p>Couldn’t load the default token. Check your connection, then try again.</p>
        <Button onClick={() => void saved.refetch()}>Try again</Button>
      </div>
    );
  return <DefaultReceiveTokenForm savedTokenAddress={saved.data} />;
}
