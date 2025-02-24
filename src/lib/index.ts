import type { CosmosClient, Token } from "./types";

import { getCosmosClient, initRelayingClient, initSkipClient } from "./clients";
import { initAppKit } from "./appkit";
import { foundAccountInfo, updateAccounts } from "./accounts";
import { toBase64, toUtf8 } from "@cosmjs/encoding";
import { updateRegistryParams } from "./registry";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { getEthBalance, getSolBalance, updateAccountBalances } from "./assets";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { type TxStatusResponse } from "@skip-go/client";
import { get } from "svelte/store";
import { relayingAddress, wagmiAdapter } from "./signers";
import { BASE_ID } from "./vars";
import { updateFeeGrants } from "./cosmos";




export type BridgeTask = {
    inAmount: string;
    inAddress: string;
    inToken: Token;

    outAmount: string;
    outToken: Token;
    outAddress?: string;
    outChainId: string;

    chainID: string;
    txHash: string;

    txStatus?: TxStatusResponse;

    explorerLink?: string;
    accCreation?: boolean;
}


export const deleteBridgeTask = (txId: string) => {
    bridgeTasks.update((tasks) => tasks.filter((t) => t.txHash !== txId));
}

export const updateBridgeTask = (txId: string, task: Partial<BridgeTask>) => {
    bridgeTasks.update((tasks) => {
        const found = tasks.find((t) => t.txHash === txId);
        if (!found) {
            console.error(`Bridge task with txId ${txId} not found`);
            return tasks;
        }
        const updated = { ...found, ...task };
        return tasks.map((t) => (t.txHash === txId ? updated : t));
    });
}


export const bridgeTasks = localStorageStore<BridgeTask[]>('bridgeTasks', []);


export const onEthAddressFound = async (
    wagmi: WagmiAdapter,
    chainId: string,
    client: CosmosClient,
    address: string,
) => {
    getEthBalance(wagmi, chainId, address); 
    updateAccounts(client, toBase64(toUtf8(address.toLowerCase())));
}

export const onSolAddressFound = async (
    client: CosmosClient,
    address: string,
) => { 
    getSolBalance(address);
    updateAccounts(client, toBase64(toUtf8(address.toLowerCase())));
}

  
export const onMountLogic = async () => {
    await initAppKit();
    initRelayingClient();
    initSkipClient();

    const client = await getCosmosClient();
    const found = get(foundAccountInfo)
    if (found) {
        updateAccountBalances(client, found.address);
        updateFeeGrants(
            client, 
            get(relayingAddress),
            found.address
        );
        
        const ethCred = found.credentials.find((c) => c.human_id?.startsWith('0x'))
        if (ethCred) {
            onEthAddressFound(get(wagmiAdapter), BASE_ID, client, ethCred.human_id!);
        }
    }
    updateRegistryParams(client);
}




