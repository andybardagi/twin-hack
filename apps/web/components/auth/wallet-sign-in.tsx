"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useConfig, useConnectors, type Connector } from "wagmi";

import { Button } from "@workspace/ui/components/button";
import { getSignInMessage, signInWallet } from "@/components/auth/sign-in-wallet";

function WalletSignIn() {
  const config = useConfig();
  const availableConnectors = useConnectors();
  const [hydrated, setHydrated] = useState(false);
  const [discoveryReady, setDiscoveryReady] = useState(false);
  // The server has no WalletConnect connector, so match its empty list until hydrated.
  const connectors = hydrated ? availableConnectors : [];

  useEffect(() => {
    setHydrated(true);
    // EIP-6963 announcements can arrive after hydration; keep listening for late wallets.
    const timer = window.setTimeout(() => setDiscoveryReady(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  const signIn = useMutation({
    mutationFn: (connector: Connector) => signInWallet(config, connector, window.location),
    retry: false,
    onSuccess: () => window.location.replace("/"),
  });

  return (
    <section aria-labelledby="sign-in-heading" className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <h1 id="sign-in-heading" className="text-2xl font-semibold tracking-tight">
          Sign in with your wallet
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect and sign a message to sign in on Arbitrum. No transaction or network switch is
          needed.
        </p>
      </div>
      <div className="flex flex-col gap-2" aria-busy={signIn.isPending}>
        {connectors.map((connector) => (
          <Button
            key={connector.uid}
            size="lg"
            disabled={signIn.isPending || signIn.isSuccess}
            onClick={() => signIn.mutate(connector)}
          >
            {signIn.isPending && signIn.variables?.uid === connector.uid
              ? "Signing in…"
              : `Continue with ${connector.name}`}
          </Button>
        ))}
      </div>
      <div role="status" aria-live="polite" className="text-sm text-muted-foreground">
        {connectors.length === 0 &&
          (discoveryReady ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">No wallet found</p>
              <p>Install or enable an Ethereum browser wallet, then reload this page.</p>
            </div>
          ) : (
            <p>Looking for wallets…</p>
          ))}
        {signIn.isPending && <p>Check your wallet to connect and approve the sign-in message.</p>}
        {signIn.isError && <p>{getSignInMessage(signIn.error)}</p>}
        {signIn.isSuccess && <p>Signed in. Taking you home…</p>}
      </div>
    </section>
  );
}

export { WalletSignIn };
