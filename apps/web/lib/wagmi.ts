import { createConfig, http, type Config } from "wagmi";
import { arbitrum } from "viem/chains";

export const wagmiConfig: Config = createConfig({
  chains: [arbitrum],
  multiInjectedProviderDiscovery: true,
  ssr: true,
  transports: { [arbitrum.id]: http() },
});
