import { GasPrice } from "@cosmjs/stargate";
import type { Chain, CosmosChain, EthChain } from "./types"
import { type Eip1193Provider } from "ethers";
import { BASE_ID, BASE_ID_HEX, BASE_RPC, LOGO_ETH, LOGO_NTRN, LOGO_SOL, NEUTRON_ID, NEUTRON_DENOM, NEUTRON_RPC, SOLANA_ID, SOLANA_RPC } from "$lib/vars";
import { writable } from "svelte/store";



export const Base : EthChain = {
    name           :   "Base",
    denom          :   "ETH",
    url            :   BASE_RPC,
    id             :   BASE_ID,
    idHex          :   BASE_ID_HEX,
    decimals       :   18,
    logo           :   "https://raw.githubusercontent.com/base-org/brand-kit/refs/heads/main/logo/symbol/Base_Symbol_Blue.svg",
    explorer       :   "https://basescan.org",
}


export const Polygon : EthChain = {
    name           :   "Polygon",
    denom          :   "POL",
    url            :   "https://polygon-rpc.com",
    id             :   "137",
    idHex          :   "0x89",
    decimals       :   18,
    logo           :   "https://raw.githubusercontent.com/0xPolygon/polygon-token-assets/refs/heads/main/assets/brandAssets/polygon_icon_gradient_on_transparent.svg",
    explorer       :   "https://polygonscan.com/",
}


export const Ethereum : EthChain = {
    name           :   "Ethereum",
    denom          :   "ETH",
    url            :   "https://eth.llamarpc.com",
    id             :   "1",
    idHex          :   "0x1",
    decimals       :   18,
    logo           :   LOGO_ETH,
    explorer       :   "https://etherscan.io/",
}



export const Solana : Chain = {
    name           :   "Solana",
    denom          :   "SOL",
    url            :   SOLANA_RPC,
    id             :   SOLANA_ID,
    logo           :   LOGO_SOL,
    decimals       :   9,
}


export const BASE_CAIP = `eip155:${BASE_ID}`;
export const SOLANA_CAIP = `solana:${SOLANA_ID}`;


export const gasPrice = GasPrice.fromString("0.02untrn");
export const prefix = "neutron";


export const Neutron: CosmosChain = {
    name          : "Neutron",
    denomName     : "NTRN",
    prefix        : prefix,
    gasPrice      : gasPrice,
    denom         : NEUTRON_DENOM,
    url           : NEUTRON_RPC,
    id            : NEUTRON_ID,
    logo          : LOGO_NTRN,
    decimals      : 6,
}

export const CosmosHub: CosmosChain = {
    name          : "Cosmos",
    denomName     : "ATOM",
    prefix        : "cosmos",
    gasPrice      :  GasPrice.fromString("0.025uatom"),
    denom         : "uatom",
    id            : "cosmoshub-4",
    decimals      : 6,
    url           : "todo",
    logo          : "todo",
}

export const Osmosis: CosmosChain = {
    name          : "Osmosis",
    denomName     : "OSMO",
    prefix        : "osmo",
    gasPrice      :  GasPrice.fromString("0.025uosmo"),
    denom         : "uosmo",
    url           : "https://rpc.osmosis.validatus.com",
    id            : "osmosis-1",
    decimals      : 6,
    logo          : "todo",
}


export const Noble : CosmosChain = {
    name          : "Noble",
    denomName     : "USDC",
    prefix        : "noble",
    gasPrice      :  GasPrice.fromString("0.01uusdc"),
    denom         : "uusdc",
    id            : "noble-1",
    decimals      : 6,
    url           : "todo",
    logo          : "todo",
}




export const getEthChain = (id : string) : EthChain => {
    if (id === BASE_ID) {
        return Base;
    } else if (id === Polygon.id) {
        return Polygon
    } else {
        throw new Error("Chain not found");
    }
}





export const selectedChain = writable<Chain>(Base);