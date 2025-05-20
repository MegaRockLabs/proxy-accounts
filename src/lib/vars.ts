import { base, type AppKitNetwork } from '@reown/appkit/networks';
import type { Metadata } from "@reown/appkit";
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
import type { ExperimentalFeature } from '@skip-go/client';


export const metadata : Metadata = {
    name: 'Proxy Accounts',
    description: 'Alternative credentials for Cosmos Dapps',
    url: 'https://megarock.app/proxy', 
    icons: ['https://assets.reown.com/reown-profile-pic.png']
}


export const chainIdsToAddresses : Record<string, string> = {
    "noble-1": "noble129gww8t0dhjyx8k3puld5xmm0hz05uh8nce9z7",
    "neutron-1": "neutron129gww8t0dhjyx8k3puld5xmm0hz05uh8ly90qh",
    "osmosis-1": "osmo129gww8t0dhjyx8k3puld5xmm0hz05uh8nqlavz",
    "cosmoshub-4": "cosmos129gww8t0dhjyx8k3puld5xmm0hz05uh8mmvd6s",
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


export const LOGO_METAMASK = "https://raw.githubusercontent.com/MetaMask/brand-resources/refs/heads/master/SVG/SVG_MetaMask_Icon_Color.svg";
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


/* 
neutron1wd2tsamztw8gthn96ldthc628k0a3p08vmsj2c2j05pn3ntp7ets06ugj8

last
neutron1cvsrhtdk0tfhzpepjqt4nj6scxzg4zq87kl5xxed9a4clmj7zyaqru9kuy

cosmos evco last
neutron16zkl4kytc6x54uaye9p4r674zczdc6rprqdd4054ld5l5frafhks3cutc3
*/


export const NEUTRON_REGISTRY = "neutron1wa367lrw89mem75x6hltv20p4vwgpd8zpqfktffcwm6wuzqamsksaqn5t5"
export const NEUTRON_ACCOUNT_ID = 3113


export const BASESCAN = "https://basescan.org/tx/"
export const MINTSCAN = "https://mintscan.io/neutron/tx/"
export const GECKO_API = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids="


