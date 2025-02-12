import { coins, type MsgSendEncodeObject } from "@cosmjs/stargate";
import type { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import type { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";

import type { Coin } from "@keplr-wallet/types";
import { writable } from "svelte/store";
import { SigningCosmWasmClient, type MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import type { FullCoin, AccountAction, CosmosClient, DepositMsg, NFT } from "./types";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { getBalance, type GetBalanceParameters } from "@wagmi/core";
import { PublicKey } from "@solana/web3.js";
import { getSolanaClient } from "./clients";
import { formatUnits } from "viem";
import { getPrice } from "./prices";
import { NeutronTokenMap } from "./tokens";



export let accountBalanceMap : Record<string, FullCoin> = {};
export const accountBalances = writable<FullCoin[]>([]);
export const accountTokens = writable<string[]>([]);


type BalanceRecords = Record<string, Record<string, string>>;
let userChainBalanceMap : BalanceRecords = {};
export const userChainBalances = writable<BalanceRecords>(userChainBalanceMap);


export const balanceChecker = async (
    chainId: string,
    key: string,
    fetcher: () => Promise<string>,
) => {
    if (!(chainId in userChainBalanceMap)) {
        userChainBalanceMap[chainId] = {};
    }
    const chainBals = userChainBalanceMap[chainId];
    if ((key in chainBals)) {
        return chainBals[key];
    }
    const bal = await fetcher();

    chainBals[key] = bal;
    userChainBalanceMap[chainId] = chainBals;
    userChainBalances.set(userChainBalanceMap);
    return bal;
}


export const getEthBalance = async (
    wagmi: WagmiAdapter,
    chainId: string,
    address: string,
    token?: string,
) => {
    const key = token ?? "ETH";
    const params: GetBalanceParameters = {
        address: address as `0x${string}`,
        chainId: Number(chainId),
    }
    if (token) params.token = token as `0x${string}`;
    const fetcher = async () => {
        const res = await getBalance(wagmi.wagmiConfig!, params);
        return res.formatted;
    }
    return balanceChecker(chainId, key, fetcher);
}


export const getSolBalance = async (
    address: string,
    token?: string,
) => {
    console.log("Sol address", address);
    console.log("Sol token", token);
    const client = await getSolanaClient();
    
    const key = token ?? "SOL";
    const fetcher = async () : Promise<string> => {
        let balance = "0";
        if (token) {
            const mint = new PublicKey(token);
            const tokenAccounts = await client.getParsedTokenAccountsByOwner(new PublicKey(address), { mint });
            console.log("Token Accounts", tokenAccounts);
            if (tokenAccounts.value.length === 0) {
                console.log("No Token balance found.");
                return "0"
            }
            const amount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
            console.log(`Token Balance: ${amount}`);
            balance = formatUnits(BigInt(amount), 6);
        } else {
            const amount = await client.getBalance(new PublicKey(address));
            console.log(`SOL Balance: ${balance}`);
            balance = formatUnits(BigInt(amount), 9);
        }
        return balance;
    }
    return await balanceChecker("solana", key, fetcher);
}




export const transferAssetsActions = (
    recipient       :  string,
    coins           :  Coin[],
    tokens          :  string[],
) => {
    
    const actions : AccountAction[] = [];

    if (coins.length > 0) {
        // Multiple coins can be transferred with one BankMsg
        actions.push({
            execute: {
                msgs: [{
                    bank: {
                        send: {
                            to_address: recipient,
                            amount: coins
                        }
                    }
                }]
            }
            
        });
    }



    return actions;
}



export const coinsToBalances = async (
    coins: Coin[],
    setMap: boolean = true
) => {
    const balances = await Promise.all(
        coins
        .filter((coin) => coin.denom in NeutronTokenMap)
        .map(async (coin) => {
            const token = NeutronTokenMap[coin.denom];
            const price = await getPrice(token.meta.geckoName);

            const amountHuman = parseFloat(
                formatUnits(BigInt(coin.amount), token.decimals)
            );

            const amountUsd = amountHuman * price;

            return {
                denom: coin.denom,
                amount: coin.amount,
                amountHuman: token.meta.isEth ? amountHuman.toFixed(4) : amountHuman.toFixed(2),
                amountUsd: amountUsd.toFixed(2),
                token
            }
        })
    )

    if (setMap) {
        accountBalanceMap = Object.fromEntries(
            balances.map((balance) => [balance.denom, balance])
        )
    }

    return balances.sort((a, b) => {
        return a.amountUsd > b.amountUsd ? -1 : 1;
    })
}


export const updateAccountBalances = async (
    client: CosmosClient,
    address: string,
) => {
    const res = await client.bank.allBalances(address);
    const balances : FullCoin[] = await coinsToBalances(res);
    accountBalances.set(balances);
}


export const depositAssets = async (
    client          :  SigningCosmWasmClient,
    signer          :  string,
    recipient       :  string,
    coins           :  Coin[],
    tokens          :  NFT[],
    msg?            :  string

) => {
    
    const messages : DepositMsg[] = [];

    if (coins.length > 0) {
        // Multiple coins can be transferred with one BankMsg
        const send : MsgSend = {
            fromAddress: signer,
            toAddress: recipient,
            amount: coins
        }

        const encoded : MsgSendEncodeObject = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: send
        }
        messages.push(encoded);
    }

    
    tokens.forEach(token => {
        
        const send = msg != undefined
        
        ? {
            send_nft: {
                token_id: token.id,
                contract: recipient,
                msg
            }
        }

        : {
            transfer_nft: {
                token_id: token.id,
                recipient
            }
        }

        const execute : MsgExecuteContract = {
            sender: signer,
            contract: token.collection,
            msg: new Uint8Array(Buffer.from(JSON.stringify(send))),
            funds: [],
        };

        const encoded : MsgExecuteContractEncodeObject = {
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: execute
        }

        messages.push(encoded);
    });



    const result = await client.signAndBroadcast(
        signer,
        messages,
        'auto'
    )
    
    return result;
}
    