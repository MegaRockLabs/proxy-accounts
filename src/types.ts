import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient, type WasmExtension  } from "@cosmjs/cosmwasm-stargate"
import type { Coin, IbcExtension, QueryClient } from "@cosmjs/stargate";

export type ContractName = "registry" | "account"
export type ChainType = "first" | "second";


export type ChainQueryClient = QueryClient & WasmExtension & IbcExtension;


export type ChainData = {
    firstWallet          : DirectSecp256k1HdWallet;
    secondWallet         : DirectSecp256k1HdWallet;
    firstAccount         : string;
    secondAccount        : string;
    firstSigningClient   : SigningCosmWasmClient;
    secondSigningClient  : SigningCosmWasmClient;
    firstQueryClient     : ChainQueryClient;
    secondQueryClient    : ChainQueryClient;
}

export type Contract = {
    code_id: number;
    name:    ContractName
    address?: string;
    migrate?: boolean;
}

export type ContractInfo = {
    contracts: Contract[];
}



export type ContractConfig = {
    contract_info_first?: ContractInfo;
    contract_info_second?: ContractInfo;
}

export type IbcInfo = {
    connectionId : string;
    clientId: string;
    portId?: string;
    channelId?: string;
}

export type IBCConfig = {
    first:  IbcInfo
    second: IbcInfo
}


export type GasConfig = {
    gasUsage: {
        [operation: string]: {
            gasUsed: string;
            txHash: string;
        }
    }
}

export type Trait = {
    display_type?: string | null;
    trait_type: string;
    value: string;
  }


export type Metadata = {
    animation_url?: string;
    attributes?: Trait[];
    background_color?: string;
    description?: string;
    external_url?: string;
    image?: string;
    image_data?: string;
    name?: string;
    youtube_url?: string;
  }


export type RegistryInitMsg = {

    params: {
        creation_fees:    Coin[],
        allowed_code_ids: number[],
        managers:         string[],
    }

}

export type FactoryInitMsg = {
    name                   : string,
    symbol                 : string,
    minter?                : string,
    metadata?              : Metadata,
    collection_info?       : any,
    marketing?             : any,
    mint?                  : any,
}

export type ProxyInitMsg = {
    admins: string[],
    mutable: boolean,
}


export type MintMsg = {
    mint: {
        token_id:    string,
        owner:       string,
        token_uri?:  string,
        extension?:  Metadata,
    }
}