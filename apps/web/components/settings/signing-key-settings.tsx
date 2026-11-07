"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { zeroAddress, type Address } from "viem";
import { arbitrum } from "viem/chains";
import { useConfig, useConnectors, useReadContract } from "wagmi";

import { paymentRouterAbi } from "@workspace/payments/abi";
import { assertNever } from "@workspace/payments/assert-never";
import { Button } from "@workspace/ui/components/button";

import { setSigningKey, signingKeyErrorMessage } from "@/components/settings/set-signing-key";
import {
  DeviceKeyError,
  DeviceKeyUnreadableError,
  getDeviceSigner,
  prepareDeviceKey,
} from "@/lib/signing-key/device-key";
import { deriveKeyState } from "@/lib/signing-key/key-state";

function keyStateMessage(state: ReturnType<typeof deriveKeyState>) {
  switch (state) {
    case "none":
      return "No signing key registered. Register this device to create orders without wallet prompts.";
    case "registered-here":
      return "Registered on this device. You can sign orders without a wallet prompt.";
    case "registered-elsewhere":
      return "Registered on another device. Rotate to use this device instead.";
    case "revoked":
      return "This device has a key, but no key is registered on chain. Register a new key to resume.";
    default:
      return assertNever(state);
  }
}

export function SigningKeySettings({ merchant, router }: { merchant: Address; router: Address }) {
  const config = useConfig();
  const connectors = useConnectors();
  const queryClient = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [confirmedRotation, setConfirmedRotation] = useState(false);
  useEffect(() => setHydrated(true), []);
  const onChain = useReadContract({
    address: router,
    abi: paymentRouterAbi,
    functionName: "signingKeyOf",
    args: [merchant],
    chainId: arbitrum.id,
    query: { refetchInterval: 3000 },
  });
  const device = useQuery({
    queryKey: ["device-key", merchant, onChain.data],
    queryFn: async () =>
      (await getDeviceSigner(merchant, onChain.data ?? zeroAddress))?.address ?? null,
    enabled: hydrated && onChain.data !== undefined,
    retry: (failures, error) => !(error instanceof DeviceKeyUnreadableError) && failures < 3,
  });
  const mutation = useMutation({
    mutationFn: async ({
      connector,
      revoke,
    }: {
      connector: (typeof connectors)[number];
      revoke: boolean;
    }) => {
      const key = revoke ? zeroAddress : await prepareDeviceKey(merchant);
      await setSigningKey(config, connector, merchant, router, key);
    },
    retry: false,
    onSuccess: async () => {
      setConfirmedRotation(false);
      await onChain.refetch();
      await queryClient.invalidateQueries({ queryKey: ["device-key", merchant] });
    },
  });
  const deviceUnreadable = device.error instanceof DeviceKeyUnreadableError;
  if (onChain.isError || (device.isError && !deviceUnreadable))
    return (
      <div role="alert" className="space-y-2">
        <p>
          {device.error instanceof DeviceKeyError
            ? device.error.message
            : "Couldn’t read the signing key. Check your connection and browser storage, then try again."}
        </p>
        <Button
          onClick={() => {
            void onChain.refetch();
            void device.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  if (!hydrated || onChain.isPending || device.isPending)
    return <p role="status">Loading signing key…</p>;
  const deviceAddress = deviceUnreadable ? null : (device.data ?? null);
  const hasRegisteredKey = onChain.data !== zeroAddress;
  return (
    <div className="space-y-4" aria-busy={mutation.isPending}>
      {deviceUnreadable ? (
        <p role="alert">{device.error?.message}</p>
      ) : (
        <p role="status">{keyStateMessage(deriveKeyState(onChain.data, deviceAddress))}</p>
      )}
      {deviceAddress && (
        <p className="break-all font-mono text-sm">Device key address: {deviceAddress}</p>
      )}
      <p className="text-sm text-muted-foreground">
        Your key stays in this browser. Clearing browser storage removes it. Wallet transactions use
        Arbitrum and require ETH for gas.
      </p>
      {hasRegisteredKey && !confirmedRotation && (
        <Button disabled={mutation.isPending} onClick={() => setConfirmedRotation(true)}>
          Rotate signing key
        </Button>
      )}
      {confirmedRotation && (
        <div className="space-y-2">
          <p role="alert">
            Rotating invalidates all open unpaid orders. Confirm before approving the transaction in
            your wallet.
          </p>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => setConfirmedRotation(false)}
          >
            Cancel rotation
          </Button>
        </div>
      )}
      {connectors.length === 0 && <p>No wallet found. Enable your wallet and reload this page.</p>}
      <div className="flex flex-col gap-2">
        {connectors.map((connector) => (
          <div key={connector.uid} className="flex flex-wrap gap-2">
            {(!hasRegisteredKey || confirmedRotation) && (
              <Button
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ connector, revoke: false })}
              >
                {hasRegisteredKey ? "Confirm rotation" : "Register signing key"} with{" "}
                {connector.name}
              </Button>
            )}
            {hasRegisteredKey && (
              <Button
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ connector, revoke: true })}
              >
                Revoke with {connector.name}
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
      {mutation.isError && (
        <p role="alert">
          {mutation.error instanceof DeviceKeyError
            ? mutation.error.message
            : signingKeyErrorMessage(mutation.error)}
        </p>
      )}
      {mutation.isSuccess && <p role="status">Signing key updated.</p>}
    </div>
  );
}
