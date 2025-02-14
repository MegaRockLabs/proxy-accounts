import { base, solana, type AppKitNetwork } from '@reown/appkit/networks';
import type { Metadata } from "@reown/appkit";
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
import type { ExperimentalFeature } from '@skip-go/client';


export const metadata : Metadata = {
    name: 'Proxy Accounts',
    description: 'Alternative credentials for Cosmos Dapps',
    url: 'http://localhost:5174', 
    icons: ['https://assets.reown.com/reown-profile-pic.png']
}


export const chainIdsToAddresses : Record<string, string> = {
    "noble-1": "noble16z43tjws3vw06ej9v7nrszu0ldsmn0eywvs50c",
    "neutron-1": "neutron16z43tjws3vw06ej9v7nrszu0ldsmn0eyzsv7d3",
    "osmosis-1": "osmo16z43tjws3vw06ej9v7nrszu0ldsmn0eyw5kvpy",
    "cosmoshub-4": "cosmos16z43tjws3vw06ej9v7nrszu0ldsmn0eyx09uhk",

};


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
    goFast: true,
}

export const networks : [AppKitNetwork, ...AppKitNetwork[]] = [base, /* solana */]

export const projectId = PUBLIC_WALLETCONNECT_ID


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

"neutron1cw20kzuq88l5nza6xyhl93tpl58f5elvt2x58egus0ky7tzfef0qjzalaf"

export const NEUTRON_REGISTRY = "neutron1eua378gwp60uhvdxrk5qmwumy5xzxdh3z7clnk0040707rcna8cs4e6tdj"
export const NEUTRON_ACCOUNT_ID = 3113


export const BASESCAN = "https://basescan.org/tx/"
export const MINTSCAN = "https://mintscan.io/neutron/tx/"
export const GECKO_API = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids="


