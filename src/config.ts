import { readFileSync, writeFileSync, } from "fs";
import type { ChainType, ContractConfig, Contract, ContractInfo, ContractName, GasConfig, IBCConfig } from "./types";
import { DEFAULT_IBC_PORT } from "./env";

const CONFIG_FOLDER = "configs";

const CONTRACT_CONFIG_NAME = "contract_config";
const GAS_CONFIG_NAME = "gas_config";
const IBC_CONFIG_NAME = "ibc_config";

const CONTRACT_CONFIG_PATH = `${CONFIG_FOLDER}/${CONTRACT_CONFIG_NAME}.json`;
const GAS_CONFIG_PATH = `${CONFIG_FOLDER}/${GAS_CONFIG_NAME}.json`;
const IBC_CONFIG_PATH = `${CONFIG_FOLDER}/${IBC_CONFIG_NAME}.json`;


export const loadContractConfig = () : ContractConfig => {
    let file : string | Buffer;
    try {
        file = readFileSync(CONTRACT_CONFIG_PATH, 'utf8');
    } catch (error) {
        throw new Error("Config file for contracts not found: " + error);
    }

    try {
        return JSON.parse(file.toString());
    } catch (error) {
        throw new Error("Error parsing contract config file as a JSON: " + error);
    }
}

export const updateCodeId = (
    code_id: number,
    name:    ContractName,
    chain:   ChainType
) : void => {
    const config = loadContractConfig();

    if (chain === "first") {
        const info = config.contract_info_first || { contracts: [] };
        const contracts = info.contracts || [];
        const contract = contracts.find(x => x.code_id === code_id);
        if (contract === undefined) {
            contracts.push({ code_id, name });
        }
        saveContractConfig({
            ...config,
            contract_info_first: {
                contracts
            }
        });

    } else if (chain === "second") {
        const info = config.contract_info_second || { contracts: [] };
        const contracts = info.contracts || [];
        const contract = contracts.find(x => x.code_id === code_id);
        if (contract === undefined) {
            contracts.push({ code_id, name });
        }
        saveContractConfig({
            ...config,
            contract_info_second: {
                contracts
            }
        });
    }
}


export const updateContractAddress = (
    address: string,
    code_id: number,
    chain:  ChainType
) : void => {
    const config = loadContractConfig();

    if (chain === "first") {
        const info = config.contract_info_first || { contracts: [] };
        const contracts = info.contracts || [];
        const contract = contracts.find(x => x.code_id === code_id);
        if (contract === undefined) {
            throw new Error(`Contract with code_id ${code_id} not found on first chain`);
        }
        contract.address = address;
        saveContractConfig({
            ...config,
            contract_info_first: {
                contracts
            }
        });

    } else if (chain === "second") {
        const info = config.contract_info_second || { contracts: [] };
        const contracts = info.contracts || [];
        const contract = contracts.find(x => x.code_id === code_id);
        if (contract === undefined) {
            throw new Error(`Contract with code_id ${code_id} not found on second chain`);
        }
        contract.address = address;
        saveContractConfig({
            ...config,
            contract_info_second: {
                contracts
            }
        });
    }
}



export const updateContractInfo = (
    info: ContractInfo,
    chain:  ChainType
) : void => {
    const config = loadContractConfig();
    if (chain === "first") {
        saveContractConfig({
            ...config,
            contract_info_first: info
        });

    } else if (chain === "second") {
        saveContractConfig({
            ...config,
            contract_info_second: info
        });
    }
}


export type ChainConfig = {
    registry_address: string,
    account_code_id: number,
}


export const findConfigContract = (
    name : ContractName,
    chain: ChainType
) : Contract => {
    const config = loadContractConfig();
    
    let contracts : Contract[];

    if (chain === "first") {
        contracts = config.contract_info_first?.contracts || [];
    } else if (chain === "second") {
        contracts = config.contract_info_second?.contracts || [];
    } else {
        throw new Error("Unknown chain type");
    }

    const contract = contracts.find(x => x.name === name);
    if (contract === undefined) {
        throw new Error(`Contract with name ${name} not found`);
    }
    return contract;
}



export const saveContractConfig = (config : ContractConfig) : void => {
    const json = JSON.stringify(config, null, 4);
    writeFileSync(CONTRACT_CONFIG_PATH, json, 'utf8');
}




export const initContractConfig = (override: boolean = false) : void => {
    saveContractConfig({});
}



export const loadGasConfig = () : GasConfig => {
    let file : string | Buffer;
    try {
        file = readFileSync(GAS_CONFIG_PATH, 'utf8');
        return JSON.parse(file.toString());
    } catch (error) {
        initGasConfig();
        return { gasUsage: {} };
    }
}



export const saveGasConfig = (data : GasConfig) : void => {
    const json = JSON.stringify(data, null, 4);
    writeFileSync(GAS_CONFIG_PATH, json, 'utf8');
}



export const initGasConfig = (override: boolean = false) : void => {
    saveGasConfig({ gasUsage: {} });
}


export const updateGasUsage = (
    contract_name: ContractName, 
    method: string, 
    txHash: string,  
    gasUsed: string
) => {
    const extraData = loadGasConfig();
    const operation = `${contract_name}_${method}`;
    extraData.gasUsage[operation] = { txHash, gasUsed }
    saveGasConfig(extraData);
}


export const defaultIbcConfig = () => {
    const cfg : IBCConfig = {
        first: {
            connectionId: "connection-0",
            clientId: "07-tendermint-1",
            channelId: "channel-0",
            portId: DEFAULT_IBC_PORT
        },
        second: {
            connectionId: "connection-0",
            clientId: "07-tendermint-1",
            channelId: "channel-0",
            portId: DEFAULT_IBC_PORT
        }
    }
    return cfg;
}


export const loadIbcConfig = () : IBCConfig => {
    let file : string | Buffer;
    file = readFileSync(IBC_CONFIG_PATH, 'utf8');
    return JSON.parse(file.toString());
}


export const saveIbcConfig = (data : IBCConfig) : void => {
    const json = JSON.stringify(data, null, 4);
    writeFileSync(IBC_CONFIG_PATH, json, 'utf8');
}



export const addIbcConfigChannel = (channel : any) : void => {

    const config = loadIbcConfig();
    config.first.channelId = channel.channelId;
    config.first.portId = channel.portId;
    config.second.channelId = channel.counterparty.channelId;
    config.second.portId = channel.counterparty.portId;
    saveIbcConfig(config);
}

export const removeIbcConfigChannel = () : void => {
    const config = loadIbcConfig();
    config.first.channelId = undefined
    config.first.portId = undefined
    config.second.channelId = undefined
    config.second.portId = undefined
    saveIbcConfig(config);
}



export const ibcConfigExists = () : boolean => {
    return true;
}


export const ibcConfigChannelExists = () : boolean => {
    if (!ibcConfigExists()) {
        return false;
    }
    const config = loadIbcConfig();
    return config.first.channelId !== undefined && config.first.portId !== undefined;
}