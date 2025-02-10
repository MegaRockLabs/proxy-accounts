import type { CosmosClient, RegistryParams,  AccountInfo } from './types';
import { writable } from 'svelte/store';
import type { Coin } from '@cosmjs/stargate';
import { NEUTRON_REGISTRY } from './vars';


export const accountCreationFees = writable<Coin[]>([]);


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
    accountCreationFees.set(res.creation_fees);
}


