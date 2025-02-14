import type { CosmosClient, Token } from "./types";

import { getCosmosClient, initRelayingClient, initSkipClient } from "./clients";
import { initAppKit } from "./appkit";
import { foundAccountInfo, updateAccounts } from "./accounts";
import { toBase64, toUtf8 } from "@cosmjs/encoding";
import { updateRegistryParams } from "./registry";
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { getEthBalance, getSolBalance, updateAccountBalances } from "./assets";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { type BridgeType, type TxStatusResponse } from "@skip-go/client";
import { get } from "svelte/store";
import { relayingAddress, wagmiAdapter } from "./signers";
import { BASE_ID } from "./vars";
import { updateFeeGrants } from "./cosmos";


type BrigeTaskStatus = "broadcasted" | "in_settled" | "brige_settling" | "out_broadcasted" | "completed" | "failed";


type s = TxStatusResponse
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




/* 

Status Success


{
    "status": "STATE_COMPLETED",
    "nextBlockingTransfer": null,
    "transferSequence": [
        {
            "axelarTransfer": {
                "fromChainID": "8453",
                "toChainID": "neutron-1",
                "type": "AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN",
                "state": "AXELAR_TRANSFER_SUCCESS",
                "txs": {
                    "contractCallWithTokenTxs": {
                        "sendTx": {
                            "txHash": "0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198",
                            "chainID": "8453",
                            "explorerLink": "https://basescan.org/tx/0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198"
                        },
                        "gasPaidTx": {
                            "txHash": "0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198",
                            "chainID": "8453",
                            "explorerLink": "https://basescan.org/tx/0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198"
                        },
                        "confirmTx": {
                            "txHash": "44AC33DBB8C71E535550E940AB2EF6933165A47E00645E31A520F70F14C66026",
                            "chainID": "axelar-dojo-1",
                            "explorerLink": "https://mintscan.io/axelar/tx/44AC33DBB8C71E535550E940AB2EF6933165A47E00645E31A520F70F14C66026"
                        },
                        "approveTx": null,
                        "executeTx": {
                            "txHash": "D4E4A55F00F7949CAF9ED7E418A5AA81E79640FA0DAE5DFB7E84A3CF4C78F0B4",
                            "chainID": "neutron-1",
                            "explorerLink": "https://www.mintscan.io/neutron/transactions/D4E4A55F00F7949CAF9ED7E418A5AA81E79640FA0DAE5DFB7E84A3CF4C78F0B4"
                        },
                        "error": null
                    }
                },
                "axelarScanLink": "https://axelarscan.io/gmp/0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198",
                "srcChainID": "8453",
                "dstChainID": "neutron-1"
            }
        }
    ],
    "transferAssetRelease": {
        "chainID": "neutron-1",
        "denom": "untrn",
        "released": true
    },
    "error": null,
    "state": "STATE_COMPLETED_SUCCESS",
    "transfers": [
        {
            "transferSequence": [
                {
                    "axelarTransfer": {
                        "fromChainID": "8453",
                        "toChainID": "neutron-1",
                        "type": "AXELAR_TRANSFER_CONTRACT_CALL_WITH_TOKEN",
                        "state": "AXELAR_TRANSFER_SUCCESS",
                        "txs": {
                            "contractCallWithTokenTxs": {
                                "sendTx": {
                                    "txHash": "0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198",
                                    "chainID": "8453",
                                    "explorerLink": "https://basescan.org/tx/0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198"
                                },
                                "gasPaidTx": {
                                    "txHash": "0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198",
                                    "chainID": "8453",
                                    "explorerLink": "https://basescan.org/tx/0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198"
                                },
                                "confirmTx": {
                                    "txHash": "44AC33DBB8C71E535550E940AB2EF6933165A47E00645E31A520F70F14C66026",
                                    "chainID": "axelar-dojo-1",
                                    "explorerLink": "https://mintscan.io/axelar/tx/44AC33DBB8C71E535550E940AB2EF6933165A47E00645E31A520F70F14C66026"
                                },
                                "approveTx": null,
                                "executeTx": {
                                    "txHash": "D4E4A55F00F7949CAF9ED7E418A5AA81E79640FA0DAE5DFB7E84A3CF4C78F0B4",
                                    "chainID": "neutron-1",
                                    "explorerLink": "https://www.mintscan.io/neutron/transactions/D4E4A55F00F7949CAF9ED7E418A5AA81E79640FA0DAE5DFB7E84A3CF4C78F0B4"
                                },
                                "error": null
                            }
                        },
                        "axelarScanLink": "https://axelarscan.io/gmp/0x7bc1b9c8febc2e8ba44a583f5fbfe6697a27bed7791fb5820f3e0ed2fb24c198",
                        "srcChainID": "8453",
                        "dstChainID": "neutron-1"
                    }
                }
            ],
            "transferAssetRelease": {
                "chainID": "neutron-1",
                "denom": "untrn",
                "released": true
            },
            "error": null,
            "state": "STATE_COMPLETED_SUCCESS",
            "nextBlockingTransfer": null
        }
    ]
}

 */