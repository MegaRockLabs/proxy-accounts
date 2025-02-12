import { localStorageStore } from "@skeletonlabs/skeleton";
import { GECKO_API } from "./vars";
import { get } from "svelte/store";
import type { SkipClient } from "@skip-go/client";
import type { GasPrice } from "@cosmjs/stargate";
import { getGasPrice } from "viem/actions";
import type { Client } from "viem";

const FRESHNESS_THRESHOLD = 1000 * 60 * 5; // 5 minutes

type Info = {
    price: number;
    lastUpdated: number;
}

export const priceDataStore = localStorageStore("priceData", {} as Record<string, Info>);


export const getPrice = async (name: string) : Promise<number> => {

    try {
        const priceData = get(priceDataStore);

        const now = Date.now();
        const info = priceData[name];
        if (info && now - info.lastUpdated < FRESHNESS_THRESHOLD) {
            return info.price;
        }
        const response = await fetch(`${GECKO_API}${name}`);
        const data = await response.json();
        const price = data[name].usd;
        priceData[name] = { price, lastUpdated: now };

        priceDataStore.set(priceData);
        return price;
    }
    catch (e) {
        console.error("Error fetching price", e);
        return 0;
    }
}


export const getEthGasPrice = async (client: Client, chainID? : number | string) : Promise<number> => {
    chainID ??= client.chain?.id;
    const key = chainID + '_gas';
    try {
        const priceData = get(priceDataStore);

        const now = Date.now();
        const info = priceData[key];

        if (info && now - info.lastUpdated < FRESHNESS_THRESHOLD) {
            return info.price;
        }
        const ethPrice = await getGasPrice(client)
        const price = parseFloat(ethPrice.toString());
        priceData[key] = { price, lastUpdated: now };
        priceDataStore.set(priceData);
        return price

    } catch (e) {
        console.error("Error fetching eth gas price", e);
        return 0;
    }
}


export const getCosmosGasPrice = async (skip: SkipClient, chainID: string) : Promise<GasPrice | undefined> => {
    const price = await skip.getRecommendedGasPrice(chainID);
    console.log("Gas price of chainID", chainID, "is: ", price);
    return price;
}
    