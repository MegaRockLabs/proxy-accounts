import { base, solana, type AppKitNetwork, polygon } from '@reown/appkit/networks';
import type { Metadata } from "@reown/appkit";
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
import type { ExperimentalFeature } from '@skip-go/client';

export const projectId = PUBLIC_WALLETCONNECT_ID

export const networks : [AppKitNetwork, ...AppKitNetwork[]] = [base, polygon, solana]

export const metadata : Metadata = {
    name: 'Proxy Accounts',
    description: 'Alternative credentials for Cosmos Dapps',
    url: 'http://localhost:5174', 
    icons: ['https://assets.reown.com/reown-profile-pic.png']
}


export const LOGO_ETH = "https://raw.githubusercontent.com/axelarnetwork/axelar-configs/main/images/tokens/weth.svg";
export const LOGO_USDC = "https://raw.githubusercontent.com/axelarnetwork/axelar-configs/main/images/tokens/usdc.svg";
export const LOGO_ATOM = "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/refs/heads/main/images/cosmoshub/uatom.png";
export const LOGO_NTRN = "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/neutron/untrn.png";
export const LOGO_SOL = "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/solana/images/sol_circle.png"


export const BASE_ID = "8453"
export const BASE_ID_HEX = "0x2105"
export const BASE_RPC = "https://mainnet.base.org"

export const SOLANA_ID = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
export const SOLANA_RPC = "https://solana-rpc.publicnode.com"

export const NEUTRON_RPC = "https://rpc.lavenderfive.com:443/neutron"
export const NEUTRON_ID = "neutron-1"
export const NEUTRON_DENOM = "untrn"
export const NEUTRON_IBC_ATOM = "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9"

export const NEUTRON_REGISTRY = "neutron1eua378gwp60uhvdxrk5qmwumy5xzxdh3z7clnk0040707rcna8cs4e6tdj"
export const NEUTRON_ACCOUNT_ID = 3113


export const GECKO_API = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids="


export const SKIP_COMMON   = {
    experimentalFeatures: ["cctp", "hyperlane", "stargate"] as ExperimentalFeature[],
    smartRelay: true,
    allowUnsafe: true,
    smartSwapOptions: {
        splitRoutes: true,
        evmSwaps: true
    },
    allowSwaps: true,
    allowMultiTx: false,
}
