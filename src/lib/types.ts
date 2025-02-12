import { QueryClient, type StakingExtension, type BankExtension, type GovExtension, type IbcExtension } from "@cosmjs/stargate";
import type { FeegrantExtension, MsgSendEncodeObject } from "@cosmjs/stargate/build/modules";
import { type MsgExecuteContractEncodeObject, type WasmExtension } from "@cosmjs/cosmwasm-stargate";
import type { Coin, GasPrice } from "@cosmjs/stargate";
import type { Eip1193Provider } from "ethers";
import type { CosmosMsg as CosmosBase } from "smart-account-auth";



export interface WindowEthereum extends Eip1193Provider {
    isMetamask?: boolean
}



export type Chain = {
    id         : string;
    name       : string;
    denom      : string;
    decimals   : number;
    logo       : string;
    url        : string;
}


export type EthChain = Chain & {
    idHex      : string;
    explorer   : string;
}


export type CosmosChain = Chain & {
    denomName    : string;
    prefix       : string;
    gasPrice     : GasPrice;
}


export type TokenMeta = {
    logo           :  string;
    geckoName      :  string;
    default        :  number;
    min            :  number;
    step?          :  number;
    isEth?         :  boolean;
    isUsd?         :  boolean;
    isGas?         :  boolean;
}


export interface Token {
    originalChain  :  string;
    name           :  string;
    denom          :  string;
    fullName       :  string;
    decimals       :  number;
    symbol         :  string;
    meta           :  TokenMeta;
}


export type CosmosToken = Token & {
    originalDenom? : string;
    originalChain? : string;
}



export type EthCredential = {
    address: string
}

export type SolCredential = {
    address: string
}

export type PasskeyCredential = {
    id: string,
    pubkey?: string,
}


export type Credential = EthCredential | SolCredential | PasskeyCredential


export type SmartAccount = {
    address: string,
    credentials: Credential[],
    balances: Record<string, string>,
}


export type CosmosClient = QueryClient 
    & StakingExtension 
    & WasmExtension 
    & BankExtension 
    & GovExtension 
    & IbcExtension 
    & FeegrantExtension



export type CredentialFullInfo = {
    id: string,
    name: string,
    hrp: string,
    human_id?: string,
    extension?: string,
}


export type AccountCredentials = {
    credentials: [string, CredentialFullInfo][],
    verifying_id: string,
    native_caller: boolean
}


    
export type FullInfo = {
    registry: string,
    balances: Coin[],
    ownership: { owner: string },
    credentials?: AccountCredentials,
}

export type ParsedAccountInfo = {
    address: string,
    credentials: CredentialFullInfo[],
    native_caller: boolean,
    verifying: CredentialInfo
}

export type CredentialInfo = {
    extension: string,
    hrp: string,
    name: string,
}

export type AccountInfo = {
    address: string,
    info? : {}
}


export type RegistryParams = {
    allowed_code_ids: number[],
    creation_fees: Coin[],
    managers: string[],
    extension: any,
}


export type StargateMsg = {
    stargate: {
        type_url: string;
        value: any;
    }
}

export type ParsedGrant = {
    granter: string,
    grantee: string,
    allowedMessages?: string[],
    expiration?: any,
    spendLimit?: Coin[],
    type: string,
} 


export type IbcTrace = {
    denom: string,
    path: string,
    chain?: string,
}


export type Attribute = {
    trait_type: string,
    value: string,
}


export type TokenMetadata = {
    name?: string,
    description?: string,
    animation_url?: string,
    image?: string,
    attributes?: Attribute[],
}


export type NFT = {
    id: string,
    collection: string,
    image?: string,
    name?: string,
    metadata?: TokenMetadata
}


export type ChainConfig = {
    registry_address: string,
    account_code_id: number,
    minter: string,
    collection: string,
}


export type DepositMsg = MsgSendEncodeObject | MsgExecuteContractEncodeObject;

export type Expiration = string


export type BasicAllowance = {
    spend_limit: Coin[];
    expiration?: Expiration
}


export type IbcFee = {
    ack_fee: Coin[],
    receive_fee: Coin[],
    timeout_fee: Coin[],
}


export type RequestPacketTimeoutHeight = {
    revision_number?: number,
    revision_height?: number
}

export type NeutronMsg = {
    custom: {
        ibc_transfer: {
            fee: IbcFee,
            memo: string,
            receiver: string,
            sender: string,
            source_channel: string,
            source_port: string
            timeout_height: RequestPacketTimeoutHeight,
            timeout_timestamp: number,
            token: Coin
        }
    }
}

export type FullCoin = {
    denom: string;
    amount: string;
    amountHuman: string,
    amountUsd: string;
    token: Token
}


export type CosmosMsg = CosmosBase | NeutronMsg

export type AccountAction =
    { execute: { msgs: CosmosMsg[] } } |
    { fee_grant: { grantee: string, allowance: BasicAllowance} }




export type RouteValues = {
    inUSD: string;
    inToken: Token;
    inValue: number;
    inPrice: number;
    inParsed: bigint;
    
    outUSD: string;
    outToken: Token;
    outValue: number;
    outPrice: number;
    outParsed: bigint;

    outOriginal: number;
    routeSecs: number;

    bridgeToken: Token;
    bridgeValue: string;
    bridgeParsed: bigint;
    bridgeUSD: number;

    gasValue: string;
    gasParsed: bigint;
    gasUSD: string;

    creationFee?: string,
    creationFeeParsed?: bigint;
    creationFeeUSD?: string;

    totalFeeValue: string;
    totalFeeParsed: bigint;
    totalFeeUSD: string;


    userAddresses: { 
        chainID: string, 
        address: string 
    }[];
}