import { writable } from "svelte/store";
import type { Coin } from "@keplr-wallet/types";

import { Grant, AllowedMsgAllowance, BasicAllowance  } from "cosmjs-types/cosmos/feegrant/v1beta1/feegrant";

import { localStorageStore } from "@skeletonlabs/skeleton";
import { toBase64 } from "@cosmjs/encoding";
import type { CosmosClient, IbcTrace, ParsedGrant, StargateMsg } from "./types";
import type { CosmosMsg } from "smart-account-auth";
import { NEUTRON_IBC_ATOM, NEUTRON_DENOM } from "./vars";



// bank
export const relayerBalances            =   writable<Coin[]>([]);
export const relayerNtrnBalance         =   writable<Coin | undefined>(undefined);
export const relayerAtomBalance         =   writable<Coin | undefined>(undefined);


export const updateRelayerBalances = async (client: CosmosClient, address: string) => {
    const balaces = await client.bank.allBalances(address);
    relayerBalances.set(balaces);
    balaces.forEach((coin) => {

        if (coin.denom == NEUTRON_DENOM) {
            relayerNtrnBalance.set(coin);
        } else if (coin.denom == NEUTRON_IBC_ATOM) {
            relayerAtomBalance.set(coin);
        }

        const lower = coin.denom.toLowerCase();
        if (lower.startsWith("ibc/") && !ibcTracesValue[coin.denom]) {
            updateIbcTrace(client, coin.denom);
        }
    })
}


export const getContractFeeGrantMessage = (
    contract: string, 
    grantee: string,
    amount: string = "1000000"
) : CosmosMsg | StargateMsg => {
    
    const basic = BasicAllowance.fromPartial({
        spendLimit: [
            {
                denom: NEUTRON_DENOM,
                amount
            }
        ],
    });

    const allowance = AllowedMsgAllowance.fromPartial({
        allowedMessages: [ "/cosmwasm.wasm.v1.MsgExecuteContract"],
        allowance: {
            typeUrl: BasicAllowance.typeUrl,
            value: BasicAllowance.encode(basic).finish(),
        }
    });


    const grant = Grant.fromPartial({
        granter: contract,
        grantee,
        allowance: {
            typeUrl: AllowedMsgAllowance.typeUrl,
            value: AllowedMsgAllowance.encode(allowance).finish(),
        }
    })


    return {
        stargate: {
            type_url: "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
            value: toBase64(Grant.encode(grant).finish())
        }
    }
} 




// feegrant
export const activeFeeGrants = writable<(ParsedGrant)[]>([]);


export const updateFeeGrants = async (
    client: CosmosClient, 
    address: string,
    granter?: string
) => {
    const res = await client.feegrant.allowances(address);

    const allGrants : Grant[] = granter 
        ? res.allowances.filter(grant => grant.granter == granter) 
        : res.allowances;

    const grants : ParsedGrant[] = allGrants.map(grant => {

        let { allowance, granter, grantee } = grant;
        const parsed : ParsedGrant = { granter, grantee, type: "" };

        if (allowance) {

            if (allowance.typeUrl == AllowedMsgAllowance.typeUrl) {
                const ama = AllowedMsgAllowance.decode(allowance.value);
                parsed.allowedMessages = ama.allowedMessages;

                if (ama.allowance?.typeUrl == BasicAllowance.typeUrl) {
                    const basic = BasicAllowance.decode(ama.allowance.value);
                    parsed.spendLimit = basic.spendLimit;
                    parsed.expiration = basic.expiration;
                    parsed.type = "AllowedMsgAllowance"
                }
            }

            else if (allowance.typeUrl == BasicAllowance.typeUrl) {
                const basic = BasicAllowance.decode(allowance.value);
                parsed.spendLimit = basic.spendLimit;
                parsed.expiration = basic.expiration;
                parsed.type = "BasicAllowance"
            }
        }

        return parsed
    })

    activeFeeGrants.set(grants);
}



// ibc
export let ibcTracesValue : Record<string, IbcTrace> = {};
export const ibcTraces   =   localStorageStore<Record<string, IbcTrace>>("ibcDenoms", ibcTracesValue);

export const updateIbcTrace = async (client: CosmosClient, ibcTrace: string) => {
    const trace = await client.ibc.transfer.denomTrace(ibcTrace)
    if (trace.denomTrace) {
        const hash = ibcTrace.slice(4)
        ibcTraces.update((t) => {
            t[hash] = {
                denom: trace.denomTrace!.baseDenom,
                path: trace.denomTrace!.path,
            }
            ibcTracesValue = t;
            return t
        });
    }
    return trace
}

