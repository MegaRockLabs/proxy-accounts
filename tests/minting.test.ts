import type { ChainData } from "../src/types";
import { describe, beforeAll, test } from 'vitest';
import {  } from "../src/checks"
import { getChainData } from '../src/chain';


describe('minting tests', () => {
    
    let chainData : ChainData;

    beforeAll(async () => {
        chainData = await getChainData();
    })

    
    test("Minting works", async () => {
        console.log("First account: ", chainData.firstAccount);
    })

});
