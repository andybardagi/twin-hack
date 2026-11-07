"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { zeroAddress, type Address } from "viem";
import { arbitrum } from "viem/chains";
import { useConfig, useConnectors, useReadContract, type Connector } from "wagmi";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";

import { payoutAddressErrorMessage, setPayoutAddress } from "@/components/settings/set-signing-key";
import { payoutAddressInputSchema } from "@/src/helpers/payout-address-schema";

const noWalletChosen: { connector?: Connector } = {};

export function ForwardAddressSettings({
  merchant,
  router,
}: {
  merchant: Address;
  router: Address;
}) {
  const config = useConfig();
  const connectors = useConnectors();
  const onChain = useReadContract({
    address: router,
    abi: paymentRouterAbi,
    functionName: "payoutAddressOf",
    args: [merchant],
    chainId: arbitrum.id,
  });
  const mutation = useMutation({
    mutationFn: ({ connector, payoutAddress }: { connector: Connector; payoutAddress: Address }) =>
      setPayoutAddress(config, connector, merchant, router, payoutAddress),
    retry: false,
    onSuccess: () => onChain.refetch(),
  });
  const inputSchema = payoutAddressInputSchema(router);
  const form = useForm({
    defaultValues: { payoutAddress: "" },
    onSubmitMeta: noWalletChosen,
    validators: { onChange: inputSchema, onSubmit: inputSchema },
    onSubmit: async ({ value, meta: { connector }, formApi }) => {
      if (!connector) return;
      const { payoutAddress } = inputSchema.parse(value);
      await mutation.mutateAsync({ connector, payoutAddress }).then(
        () => formApi.reset(),
        () => {
          // useMutation exposes the failure.
        },
      );
    },
  });

  if (onChain.isError)
    return (
      <div role="alert" className="space-y-2">
        <p>Couldn’t read the forward address. Check your connection, then try again.</p>
        <Button onClick={() => void onChain.refetch()}>Try again</Button>
      </div>
    );
  if (onChain.isPending) return <p role="status">Loading forward address…</p>;
  const hasForwardAddress = onChain.data !== zeroAddress;

  return (
    <div className="space-y-4" aria-busy={mutation.isPending}>
      {hasForwardAddress ? (
        <p role="status" className="break-all">
          Settlements go to <span className="font-mono text-sm">{onChain.data}</span>
        </p>
      ) : (
        <p role="status">No forward address set. Settlements go to your signed-in wallet.</p>
      )}
      <form.Field name="payoutAddress">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor="forward-address">
              {hasForwardAddress ? "New forward address" : "Forward address"}
            </FieldLabel>
            <Input
              id="forward-address"
              name={field.name}
              type="text"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              value={field.state.value}
              disabled={mutation.isPending}
              aria-invalid={field.state.meta.errors.length > 0}
              aria-describedby="forward-address-description forward-address-error"
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
            <FieldDescription id="forward-address-description">
              Stored only on chain. Saving or clearing it requires a wallet transaction on Arbitrum.
            </FieldDescription>
            <FieldError id="forward-address-error" errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>
      {connectors.length === 0 && <p>No wallet found. Enable your wallet and reload this page.</p>}
      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <div key={connector.uid} className="flex flex-wrap gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => void form.handleSubmit({ connector })}
            >
              Save with {connector.name}
            </Button>
            {hasForwardAddress && (
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ connector, payoutAddress: zeroAddress })}
              >
                Clear with {connector.name}
              </Button>
            )}
          </div>
        ))}
      </div>
      {mutation.isPending && (
        <p role="status">
          Check your wallet, switch to Arbitrum if requested, and approve. Waiting for confirmation…
        </p>
      )}
      {mutation.isError && <p role="alert">{payoutAddressErrorMessage(mutation.error)}</p>}
      {mutation.isSuccess && (
        <p role="status">
          {mutation.variables.payoutAddress === zeroAddress
            ? "Forward address cleared."
            : "Forward address updated."}
        </p>
      )}
    </div>
  );
}
