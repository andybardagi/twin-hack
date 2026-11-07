"use client";

import { WagmiProvider } from "wagmi";

import { WalletSignIn } from "@/components/auth/wallet-sign-in";
import { wagmiConfig } from "@/lib/wagmi";

function SignInProvider({ redirectTo }: { redirectTo?: string }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <WalletSignIn redirectTo={redirectTo} />
    </WagmiProvider>
  );
}

export { SignInProvider };
