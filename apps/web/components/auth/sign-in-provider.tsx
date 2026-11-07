"use client";

import { WagmiProvider } from "wagmi";

import { WalletSignIn } from "@/components/auth/wallet-sign-in";
import { wagmiConfig } from "@/lib/wagmi";

function SignInProvider() {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <WalletSignIn />
    </WagmiProvider>
  );
}

export { SignInProvider };
