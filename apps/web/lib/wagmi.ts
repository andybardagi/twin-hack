import { createConfig, http, type Config } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { arbitrum } from "viem/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
// WalletConnect's provider requires indexedDB, so it can't initialize during SSR.
const supportsWalletConnect = typeof window !== "undefined" && projectId;

export const wagmiConfig: Config = createConfig({
  chains: [arbitrum],
  connectors: supportsWalletConnect ? [walletConnect({ projectId })] : [],
  multiInjectedProviderDiscovery: true,
  ssr: true,
  transports: { [arbitrum.id]: http() },
});
