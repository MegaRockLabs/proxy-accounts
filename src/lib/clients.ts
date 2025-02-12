import { 
    QueryClient, 
    setupStakingExtension, 
    setupBankExtension, 
    setupGovExtension, 
    setupIbcExtension, 
    setupFeegrantExtension 
} from "@cosmjs/stargate";
import { SigningCosmWasmClient, setupWasmExtension } from "@cosmjs/cosmwasm-stargate";
import { Comet38Client } from "@cosmjs/tendermint-rpc";
import { Secp256k1HdWallet } from "@cosmjs/amino";
import { get, writable } from "svelte/store";


import { PUBLIC_RELAYING_MNEMONIC } from "$env/static/public";
import { SkipClient } from "@skip-go/client";


import { gasPrice, prefix } from "$lib/chains";
import type { CosmosClient } from "./types";
import { getCosmosSigner, getEVMSigner, getSVMSigner, relayingAddress, relayingSigner, wagmiAdapter, wagmiValue } from "./signers";
import { Connection } from "@solana/web3.js";
import { BASE_ID, NEUTRON_ID, NEUTRON_RPC, SOLANA_RPC } from "./vars";
import type { Client } from "viem";


export const relayingClient = writable<SigningCosmWasmClient>();
export const skipClient = writable<SkipClient>();

export const cosmosClient = writable<CosmosClient>();
export const solanaClient = writable<Connection>();
export const ethClient    = writable<Client>();

let ethClientValueMap : Record<string, Client> = {};
let cosmosClientValue : CosmosClient | undefined;
let solanaClientValue : Connection | undefined;



export const getCosmosClient = async () : Promise<CosmosClient> => {
    if (cosmosClientValue) return cosmosClientValue;
    const client = await Comet38Client.connect(NEUTRON_RPC);
    const extended = QueryClient.withExtensions(client, 
        // @ts-ignore
        setupWasmExtension, 
        setupBankExtension,
        setupStakingExtension, 
        setupGovExtension,
        setupIbcExtension,
        setupFeegrantExtension
    )
    cosmosClientValue = extended;
    cosmosClient.set(extended);
    return extended;
}



export const getSolanaClient = async () : Promise<Connection> => {
    if (solanaClientValue) return solanaClientValue;
    const connection = new Connection(SOLANA_RPC, "confirmed");
    solanaClientValue = connection;
    solanaClient.set(connection);
    return connection;
}


export const getEthClient = async (chainId: string = BASE_ID) => {
    const existing = ethClientValueMap[chainId];
    if (existing) return existing;
    const wagmi = wagmiValue ?? get(wagmiAdapter);
    const client = wagmi.wagmiConfig.getClient({ chainId: Number(chainId) });
    ethClientValueMap[chainId] = client;
    ethClient.set(client);
    return client;
}



export const initRelayingClient = async () : Promise<SigningCosmWasmClient> => {
    const signer = await Secp256k1HdWallet.fromMnemonic(PUBLIC_RELAYING_MNEMONIC, { prefix });
    relayingSigner.set(signer);

    const allAcoounts = await signer.getAccounts()
    const account = allAcoounts[0];
    relayingAddress.set(account.address);

    // @ts-ignore
    const client = await SigningCosmWasmClient.connectWithSigner(NEUTRON_RPC, signer, { gasPrice } )
    relayingClient.set(client);

    // updateFeeGrants(queryClientValue ?? get(queryClient), account.address);
    return client;
}



export const initSkipClient = async () : Promise<SkipClient> => {
    const client = new SkipClient({
        getCosmosSigner,
        getEVMSigner,
        getSVMSigner,
        endpointOptions: {
            endpoints: {
                [NEUTRON_ID]: {
                    rpc: NEUTRON_RPC,
                    rest: NEUTRON_RPC.replace("rpc", "rest"),
                },
                ["solana"]: {
                    rpc: SOLANA_RPC,
                }
            }
        }
    });
    skipClient.set(client);
    return client;
}