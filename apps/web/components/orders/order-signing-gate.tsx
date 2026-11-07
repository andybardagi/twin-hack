"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Address } from "viem";
import { arbitrum } from "viem/chains";

import { assertNever } from "@workspace/payments/assert-never";
import { Button } from "@workspace/ui/components/button";

import { CreateOrderForm } from "@/components/orders/create-order-form";
import {
  DeviceKeyError,
  DeviceKeyUnreadableError,
  getDeviceSigner,
} from "@/lib/signing-key/device-key";
import { deriveKeyState } from "@/lib/signing-key/key-state";

function SettingsNotice({ reason }: { reason: string }) {
  return (
    <div role="alert" className="space-y-2">
      <p>{reason}</p>
      <Link className="text-sm underline" href="/settings">
        Go to settings
      </Link>
    </div>
  );
}

export function OrderSigningGate({
  merchant,
  router,
  signingKey,
  defaultTokenAddress,
}: {
  merchant: Address;
  router: Address;
  signingKey: Address;
  defaultTokenAddress: string;
}) {
  const device = useQuery({
    queryKey: ["device-signer", merchant, signingKey],
    queryFn: () => getDeviceSigner(merchant, signingKey),
    retry: (failures, error) => !(error instanceof DeviceKeyUnreadableError) && failures < 3,
  });
  if (device.isPending) return <p role="status">Checking this device…</p>;
  if (device.error instanceof DeviceKeyUnreadableError)
    return <SettingsNotice reason={device.error.message} />;
  if (device.isError)
    return (
      <div role="alert" className="space-y-2">
        <p>
          {device.error instanceof DeviceKeyError
            ? device.error.message
            : "Couldn’t read this device’s signing key. Check your browser storage, then try again."}
        </p>
        <Button onClick={() => void device.refetch()}>Try again</Button>
      </div>
    );

  const signer = device.data;
  const state = deriveKeyState(signingKey, signer?.address ?? null);
  switch (state) {
    case "none":
      return (
        <SettingsNotice reason="Register a signing key in settings before creating an order." />
      );
    case "revoked":
      return (
        <SettingsNotice reason="Your signing key was revoked. Register a new key in settings before creating an order." />
      );
    case "registered-elsewhere":
      return (
        <SettingsNotice reason="Your signing key is registered on another device. Rotate it in settings to create orders here." />
      );
    case "registered-here":
      if (!signer) throw new Error("A key registered here must have a device signer.");
      return (
        <CreateOrderForm
          defaultTokenAddress={defaultTokenAddress}
          sign={(order) => signer.signOrder({ chainId: arbitrum.id, router }, order)}
        />
      );
    default:
      return assertNever(state);
  }
}
