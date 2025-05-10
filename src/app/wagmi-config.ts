import { createConfig } from 'wagmi'
import { sapphireTestnet } from 'viem/chains'
import {
  injectedWithSapphire,
  sapphireHttpTransport,
} from '@oasisprotocol/sapphire-wagmi-v2'

export const config = createConfig({
  multiInjectedProviderDiscovery: false,
  connectors: [
    injectedWithSapphire(),
  ],
  chains: [sapphireTestnet],
  transports: {
    [sapphireTestnet.id]: sapphireHttpTransport(),
  },
  batch: {
    multicall: false,
  },
})

// Export chain ID constant
export const SAPPHIRE_TESTNET_ID = sapphireTestnet.id; 