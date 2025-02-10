import { derived, writable } from 'svelte/store';
import type { Chain, CosmosToken, Token, TokenMeta } from './types';
import { BASE_ID, LOGO_ATOM, LOGO_ETH, LOGO_NTRN, LOGO_USDC, NEUTRON_ID, SOLANA_ID } from './vars';
import { selectedChain } from './chains';


export const USDC_INPUT : TokenMeta = {
    default: 10,
    min: 3,
    step: 1,
    geckoName: "usd-coin",
    logo: LOGO_USDC,
    isUsd: true,
}

export const ETH_INPUT : TokenMeta = {
    default: 0.0005,
    min: 0.0005,
    geckoName: "ethereum",
    logo: LOGO_ETH,
    isEth: true,
}

export const WST_ETH_INPUT : TokenMeta = {
    default: 0.001,
    min: 0.001,
    geckoName: "wrapped-steth",
    logo: "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/wsteth.svg",
    isEth: true,
}

export const SOL_INPUT : TokenMeta = {
    default: 0.1,
    min: 0.01,
    geckoName: "solana",
    logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
}

export const NTRN_INPUT : TokenMeta = {
    default: 100,
    min: 1,
    step: 0.1,
    geckoName: "neutron-3",
    logo: LOGO_NTRN,
    isGas: true,
}

export const ATOM_INPUT : TokenMeta = {
    default: 5,
    min: 1,
    geckoName: "cosmos",
    logo: LOGO_ATOM,
    isGas: true,
}

/////////

export const NTRN : CosmosToken = {
    originalChain : NEUTRON_ID,
    decimals: 6,
    denom: "untrn",
    name: "Neutron",
    fullName: "Neutron",
    symbol: "NTRN",
    meta: NTRN_INPUT,
}


export const ATOM : CosmosToken = {
    originalChain: "cosmoshub-4",
    decimals: 6,
    denom: "ibc/C4CFF46FD6DE35CA4CF4CE031E643C8FDC9BA4B99AE598E9B0ED98FE3A2319F9",
    name: "Atom",
    fullName: "(IBC) ATOM",
    symbol: "ATOM",
    meta: ATOM_INPUT,
}


export const ALL_ETH : CosmosToken = {
    originalChain: "osmosis-1",
    decimals: 18,
    denom: "ibc/E39239AE88D45746100FA4A9B3E1E29008CADF8AC2CAD4132A7609655AE323EB",
    originalDenom: "factory/osmo1k6c8jln7ejuqwtqmay3yvzrg3kueaczl96pk067ldg8u835w0yhsw27twm/alloyed/allETH",
    name: "Eth",
    fullName: "(IBC) ETH",
    symbol: "ETH",
    meta: ETH_INPUT,
}

export const OSMO_SOL : CosmosToken = {
    originalChain: "osmosis-1",
    denom: "factory/osmo1n3n75av8awcnw4jl62n3l48e6e4sxqmaf97w5ua6ddu4s475q5qq9udvx4/alloyed/allSOL",
    name: "Sol",
    fullName: "(IBC) SOL",
    symbol: "SOL",
    decimals: 9,
    meta: SOL_INPUT,
}

export const ALL_SOL : CosmosToken = {
    originalChain: "osmosis-1",
    denom: "ibc/BF7BDD572D446678B527325A712AF2B5B68B49A4D8159FDF14D7389DB5269C67",
    originalDenom: OSMO_SOL.denom,
    name: "Sol",
    fullName: "(IBC) SOL",
    symbol: "SOL",
    decimals: 9,
    meta: SOL_INPUT,
}


export const WST_ETH : CosmosToken = {
    originalChain: "neutron-1",
    decimals: 18,
    denom: "factory/neutron1ug740qrkquxzrk2hh29qrlx3sktkfml3je7juusc2te7xmvsscns0n2wry/wstETH",
    name: "wstEth",
    fullName: "Wrapped Staked ETH",
    symbol: "wstETH",
    meta: WST_ETH_INPUT
}


export const AXL_USDC : CosmosToken = {
    originalChain: "axelar-dojo-1",
    decimals: 6,
    denom: "ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349",
    name: "Usdc",
    fullName: "(IBC) Axelar USDC",
    symbol: "axlUSDC",
    meta: USDC_INPUT,
}


export const AXL_ETH : CosmosToken = {
    originalChain: "axelar-dojo-1",
    decimals: 18,
    denom: "ibc/A585C2D15DCD3B010849B453A2CFCB5E213208A5AB665691792684C26274304D",
    name: "Eth",
    fullName: "(IBC) Axelar ETH",
    symbol: "axlwETH",
    meta: ETH_INPUT,
}



export const NOBLE_USDC : CosmosToken = {
    originalChain: "noble-1",
    decimals: 6,
    denom: "ibc/B559A80D62249C8AA07A380E2A2BEA6E5CA9A6F079C912C3A9E9B494105E4F81",
    name: "Usdc",
    fullName: "(IBC) Noble USDC",
    symbol: "USDC",
    meta: USDC_INPUT,
}


export const BASE_ETH : Token = {
    originalChain: BASE_ID,
    decimals: 18,
    denom: "base-native",
    name: "Eth",
    symbol: "ETH",
    fullName: "Native ETH",
    meta: ETH_INPUT,
}



export const BASE_WETH : Token = {
    originalChain: BASE_ID,
    decimals: 18,
    denom: "0x4200000000000000000000000000000000000006",
    name: "wEth",
    symbol: "WETH",
    fullName: "Wrapped Eth",
    meta: ETH_INPUT,
}


export const BASE_USDC : Token = {
    originalChain: BASE_ID,
    decimals: 6,
    denom: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    name: "Usdc",
    symbol: "USDC",
    fullName: "Base USDC",
    meta: USDC_INPUT,
}

export const BASE_AXL_USDC : Token = {
    originalChain: BASE_ID,
    decimals: 6,
    denom: "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
    name: "axlUsdc",
    symbol: "axlUSDC",
    fullName: "Axelar Wrapped USDC",
    meta: USDC_INPUT,
}

export const SOLANA_NATIVE : Token = {
    originalChain: "solana",
    denom: "solana-native",
    name: "Sol",
    symbol: "SOL",
    decimals: 9,
    fullName: "Native SOL",
    meta: SOL_INPUT
}


export const SOLANA_USDC : Token = {
    originalChain: "solana",
    denom: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "Usdc",
    symbol: "USDC",
    decimals: 6,
    fullName: "Solana USDC",
    meta: USDC_INPUT,
}



/* 
 {
          "denom": "ibc/1E43D59E565D41FB4E54CA639B838FFD5BCFC20003D330A56CB1396231AA1CBA",
          "chain_id": "osmosis-1",
          "origin_denom": "factory/wormhole14ejqjyq8um4p3xfqj74yld5waqljf88fz25yxnma0cngspxe3les00fpjx/8sYgCzLRJC3J7qPn2bNbx6PiGcarhyx8rBhVaNnfvHCA",
          "origin_chain_id": "wormchain",
          "trace": "transfer/channel-2186",
          "is_cw20": false,
          "is_evm": false,
          "is_svm": false,
          "symbol": "SOL.wh",
          "name": "SOL.wh",
          "logo_uri": "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/solana/images/sol_circle.png",
          "decimals": 8,
          "description": "Solana (SOL) is the native asset of the Solana blockchain.",
          "coingecko_id": "solana",
          "recommended_symbol": "SOL.wh"
        },

         {
          "denom": "ibc/F08DE332018E8070CC4C68FE06E04E254F527556A614F5F8F9A68AF38D367E45",
          "chain_id": "osmosis-1",
          "origin_denom": "factory/wormhole14ejqjyq8um4p3xfqj74yld5waqljf88fz25yxnma0cngspxe3les00fpjx/HJk1XMDRNUbRrpKkNZYui7SwWDMjXZAsySzqgyNcQoU3",
          "origin_chain_id": "wormchain",
          "trace": "transfer/channel-2186",
          "is_cw20": false,
          "is_evm": false,
          "is_svm": false,
          "symbol": "USDC.sol.wh",
          "name": "USDC.sol.wh",
          "logo_uri": "https://raw.githubusercontent.com/cosmos/chain-registry/master/_non-cosmos/ethereum/images/usdc.png",
          "decimals": 6,
          "description": "Solana USD Coin (Wormhole), Solana USDC, factory/wormhole14ejqjyq8um4p3xfqj74yld5waqljf88fz25yxnma0cngspxe3les00fpjx/HJk1XMDRNUbRrpKkNZYui7SwWDMjXZAsySzqgyNcQoU3",
          "coingecko_id": "usd-coin",
          "recommended_symbol": "USDC.sol.wh"
        },
 */



export const getSourceTokens = (chain: Chain) : Token[] => {
    if (chain.id === BASE_ID) {
        return [BASE_ETH, BASE_WETH, BASE_USDC];
    } else if (chain.id === SOLANA_ID) {
        return [SOLANA_USDC];
    } else {
        console.error("Chain not found", chain.name);
        return [];
    }
}

export const NeutronTokenMap = {
    [NTRN.denom]: NTRN,
    [ATOM.denom]: ATOM,
    [ALL_ETH.denom]: ALL_ETH,
    [ALL_SOL.denom]: ALL_SOL,
    [WST_ETH.denom]: WST_ETH,
    [AXL_USDC.denom]: AXL_USDC,
    [NOBLE_USDC.denom]: NOBLE_USDC,
}



export const getDestinationTokens = (token: Token) : Token[] => {

    return Object.values(NeutronTokenMap);

    if (token.denom === SOLANA_USDC.denom) return [NTRN, NOBLE_USDC];
    else if (token.denom === BASE_ETH.denom) return [NTRN, ALL_ETH, WST_ETH, NOBLE_USDC];
    else if (token.denom === BASE_WETH.denom) return [NTRN, ALL_ETH, WST_ETH, NOBLE_USDC];
    else if (token.denom === BASE_USDC.denom) return [NOBLE_USDC, NTRN];
    else {
        console.error("Token not found", token);
        return [];
    }
}



export const inToken = writable<Token>(BASE_ETH);
export const outAddress = writable<string>();


export const outTokens = derived([inToken, outAddress], ([inToken, outAddress]) => {

    if (inToken.denom == BASE_ETH.denom) return Object.values(NeutronTokenMap);
    return getDestinationTokens(inToken);
});