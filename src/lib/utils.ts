import { formatUnits, parseUnits } from "viem";
import { ibcTracesValue } from "./cosmos";
import { NEUTRON_IBC_ATOM, NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY } from "./vars";
import { CosmosHub, Noble, Osmosis } from "./chains";
import { userAddress } from "./accounts";
import { get } from "svelte/store";
import type { Token } from "./types";


let timer: NodeJS.Timer;
export const debounce = (func: () => void, waitFor: number = 500) => {
    clearTimeout(timer);
    timer = setTimeout(func, waitFor);
}


export const formatSeconds = (second : number) => {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (num : number) {
        return (num > 1) ? 's' : '';
    }

    let temp = Math.floor(second);

    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'a few seconds'; //'just now' //or other string you like;
}


export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export const formatAddress = (address: string, symbols: number = 4) => 
    address.slice(0, symbols+2) + "..." + address.slice(-symbols)



export const formatAmount = (amount: string | number | undefined, decimals: number = 6) => {
    if (!amount) return "0.00";
    return (Number(amount) / 10 ** decimals).toFixed(2)
}


export const formatWithCommas = (amount : string | number) => {
    return amount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
}


export const assertFulfilled = <T>(item: PromiseSettledResult<T>): item is PromiseFulfilledResult<T> => {
    return item.status === 'fulfilled';
}




export const denomToHuman = (denom: string) : string => {
    if (denom === NEUTRON_DENOM) {
        return "NTRN"
    } else if (denom == NEUTRON_IBC_ATOM) {
        return "ATOM (IBC)"
    }  else  {
        const lower = denom.toLowerCase()
        if (lower.startsWith("ibc/")) {
            const hash = denom.slice(4)
            console.log("hash", hash)
            console.log("ibcTracesValue", ibcTracesValue)
            const trace = ibcTracesValue[hash] 
            if (trace) {
                return denomToHuman(trace.denom + " (IBC)") 
            } else {
                return "ibc/" + formatAddress(hash)
            }
        } else {
            return denom.slice(1).toUpperCase()
        }
    }

}



const UNITS = [
    { name: "Wei", decimals: 0 },
    { name: "Kwei", decimals: 3 },
    { name: "Mwei", decimals: 6 },
    { name: "Gwei", decimals: 9 },
    { name: "Szabo", decimals: 12 },
    { name: "Finney", decimals: 15 },
    { name: "Ether", decimals: 18 },
  ];
  
export const formatEth = (wei: number | string) => {
    const value = parseUnits(
        wei.toLocaleString('fullwide', {useGrouping:false}),
        18
    );
    for (const unit of UNITS) {
        const formatted = Number(formatUnits(value, unit.decimals));
        if (formatted >= 0.01 && formatted < 100) {
            const power = unit.decimals - 18;
            let label = unit.name;
            if (power !== 0) label += ` (10 ^ ${power})`;
            return {
                value: formatted.toFixed(2),
                unit: unit.name,
                power,
                label,
            }
        }
    }
    return {
        value: value.toString(),
        unit: "Wei",
        power: 0,
        label: "Wei",
    }
  }


export  const idToChain = (id: string, neutronRelay: boolean = false) => {
    if (id == NEUTRON_ID) {
      if (neutronRelay) return "neutron16z43tjws3vw06ej9v7nrszu0ldsmn0eyzsv7d3"
      return NEUTRON_REGISTRY;
    }
    else if (id == CosmosHub.id) return "cosmos16z43tjws3vw06ej9v7nrszu0ldsmn0eyx09uhk";
    else if (id == Osmosis.id) return "osmo16z43tjws3vw06ej9v7nrszu0ldsmn0eyw5kvpy";
    else if (id == Noble.id) return "noble16z43tjws3vw06ej9v7nrszu0ldsmn0eywvs50c";
    else return get<string>(userAddress)    
  }




const camelize = (str: string) => {
    const splits = str.split('_');
    return splits[0] + splits.slice(1).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

export const camelizeObject = (obj: any) => {
    const newObj : Record<string, any> = {};
    for (const key in obj) {
        newObj[camelize(key)] = obj[key];
    }
    return newObj;
}


export const formatValue = (value: string | number, token: Token) => {
    if (token.meta.isEth) {
        const f = formatEth(value);
        if (f.power) {
            return `${f.value} ${f.unit}`;
        }
    }
    return parseFloat(value.toString()).toFixed(2)
}


const parseErrorText = (error: any) => {
    if (error instanceof Error) {
        return error.message;
    } else if (typeof error === "string") {
        return error;
    } else {
        return JSON.stringify(error);
    }
}

export const formatError = (error: any) => {
    const text = parseErrorText(error);
    const low = text.toLowerCase();
    
    if (low.includes("smaller than") || low.includes("insufficient")) {
        return "Insufficient funds"
    }

    if (low.includes("exists")) {
        return "Account controlled by this credential already exists"
    }

    return text;
}