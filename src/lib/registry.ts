import type { CosmosClient, RegistryParams,  AccountInfo, FullCoin } from './types';
import { writable } from 'svelte/store';
import { NEUTRON_REGISTRY } from './vars';
import { coinsToBalances } from './assets';


export const accountCreationFees = writable<FullCoin[]>([]);


export const getAccountInfo = async (
    client: CosmosClient,
    credentialId: string | string[]
) : Promise<AccountInfo | undefined> => {

    const query = typeof credentialId === "string" ? { one: credentialId } : { many: credentialId };

    try {
        const res =  await client.wasm.queryContractSmart(NEUTRON_REGISTRY, { account_info: { query} })
        return res
    } catch (e) {
        //console.error("Failed to get account info", e);
        //return undefined;
    }
}




export const getRegistryParams = async (
    client: CosmosClient,
) : Promise<RegistryParams> => {
    return await client.wasm.queryContractSmart(
        NEUTRON_REGISTRY,
        {
            registry_params: {}
        }
    )
}


export const updateRegistryParams = async (
    client: CosmosClient,
) => {
    const res = await getRegistryParams(client);
    const bals = await coinsToBalances(res.creation_fees);
    accountCreationFees.set(bals);
}


