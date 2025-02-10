
import type { DeliverTxResponse, ExecuteResult, IndexedTx, SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import type { ChainQueryClient, ChainType, ContractName, FactoryInitMsg, MintMsg, ProxyInitMsg, RegistryInitMsg } from "./types";

import { updateGasUsage } from "./config";
import { readFileSync } from "fs"
import { existsSync } from 'fs';
import { findConfigContract, updateCodeId, updateContractAddress } from "./config";



const CONTRACT_FOLDER = "artifacts/"


export const nameToFilePath = (contract_name: ContractName) => {
    let name;
    if (contract_name === "registry") {
        name = "cw83_proxy_registry";
    } else {
        name = "cw82_proxy_account";
    }
    return CONTRACT_FOLDER + name + ".wasm";
}


export const nameToInitMsg = async (
    contract_name   : ContractName, 
    chain           : ChainType,
) : Promise<RegistryInitMsg> => {

    if (contract_name === "registry") {

        const config = findConfigContract("account", chain);

        const msg : RegistryInitMsg = {
            params: {
                allowed_code_ids: [config.code_id],
                managers: [],
                creation_fees: []
            }
        };
        return msg;  
    }  

    else {
        throw new Error("Can't get instantiate message for " + contract_name + " contract");
    }
}


export const uploadContract = async (
    client: SigningCosmWasmClient,
    sender: string,
    name: ContractName,
    chain: ChainType
) : Promise<number> => {

    const wasmPath = nameToFilePath(name);

    if (!existsSync(wasmPath)) {
        throw new Error(name + " contract not found");
    }

    console.log("Uploading contract", name + ".wasm to", chain, "chain");
    
    const wasm_byte_code = readFileSync(wasmPath) as unknown as Uint8Array;
    try {
        const res = await client.upload(sender, wasm_byte_code, "auto")
        console.log("Successfull uploaded", name, "with code id", res.codeId, "to", chain, "chain. Used gas:", res.gasUsed, "\n");
        updateGasUsage(name, "upload", res.transactionHash, res.gasUsed.toString(10));
        console.log("Updated gas usage for", name, "contract");
        updateCodeId(res.codeId, name, chain);
        return res.codeId;

    } catch (error) {   
        throw new Error("Error uploading " + name + " contract: " + error);
    }

}



export const instantiateContract = async (
    client: SigningCosmWasmClient,
    sender: string,
    code_id: number,
    name: ContractName,
    chain: ChainType
) : Promise<string> => {
    
    const initMsg = await nameToInitMsg(name, chain);
    console.log("Instantiating contract", name, "from code id", code_id, "on", chain, "chain");

    try {
        const res = await client.instantiate(
            sender, 
            code_id, 
            initMsg, 
            `${name}-${new Date().toISOString()}`,
            "auto",
            { admin: sender }
        );
        console.log("Successfully instantiated", name, "with contract address", res.contractAddress, "on", chain,  "chain. Used gas:", res.gasUsed, "\n");
        updateGasUsage(name, "instantiate", res.transactionHash, res.gasUsed.toString(10));
        updateContractAddress(res.contractAddress, code_id, chain);
        return res.contractAddress

    } catch (error) {
        
        throw new Error("Error instantiating " + name + " contract: " + error);
    }
}




export const queryContract = async (
    client : ChainQueryClient,
    name   : ContractName,
    chain  : ChainType,
    query  : object
) : Promise<any> => {
    const contract = findConfigContract(name, chain);
    try {
        return await client.wasm.queryContractSmart(contract.address!, query);
    } catch (error) {
        throw new Error("Error querying " + name + " contract with" +  JSON.stringify(query) + " on " + chain + " chain: " + error);
    }
}


export const executeContract = async (
    client : SigningCosmWasmClient,
    sender : string,
    contract: ContractName,
    msg: object,
    chain: ChainType,
) : Promise<ExecuteResult> => {

    const contractInfo = findConfigContract(contract, chain);
    const operation = Object.keys(msg)[0];

    try {
        const res = await client.execute(sender, contractInfo.address!, msg, "auto");
        updateGasUsage(contract, operation, res.transactionHash, res.gasUsed.toString(10));
        return res;
    } catch (error) {
        throw new Error("Error executing " + contract + " contract with " +  JSON.stringify(msg) + " on " + chain + " chain: " + error);
    }
}

