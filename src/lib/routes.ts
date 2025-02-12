import type { EstimatedFee, SwapVenue } from "@skip-go/client";
import { Base, CosmosHub, gasPrice, Neutron, Noble, Osmosis } from "./chains";
import { ALL_ETH, AllTokensMap, ATOM, AXL_USDC, BASE_ETH, BASE_USDC, BASE_WETH, NOBLE_USDC, NTRN, NTRN_INPUT, SOLANA_USDC, WST_ETH } from "./tokens"
import type { CosmosTx, MsgsDirectResponse, MultiChainMsg, RouteResponse, SkipClient, Tx } from "@skip-go/client";
import type { FullCoin, AccountAction, CosmosClient, CosmosMsg, NeutronMsg, ParsedAccountInfo, RouteValues } from "./types";
import { camelizeObject, formatValue, idToChain } from "./utils";
import { bridgeTasks, updateBridgeTask, type BridgeTask } from "$lib";
import { executeAccountActions, updateAccounts } from "./accounts";
import { BASE_ID, NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY } from "./vars";
import { MsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx";
import { coins } from "@cosmjs/stargate";
import { toUtf8 } from "@cosmjs/encoding";

import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { toBinary, type MsgExecuteContractEncodeObject, type SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { writable } from "svelte/store";
import { getEthGasPrice, getCosmosGasPrice as getGasPriceC, getPrice } from "./prices";
import { formatUnits, parseUnits } from "viem";
import { inValue, routeValues } from "./values";
import { getEthClient } from "./clients";
import { estimateGas, getGasPrice } from "viem/actions";
import { Decimal } from "@cosmjs/math";


type RouteInfo = {
    time: number;
    swap? : boolean;
    onlyTwo?: boolean;
    feeUsd: number;
    chadresses?: string[];
}

type DestInfo = {
    nonGo?: RouteInfo;
    go: RouteInfo;
}

const withOsmo = [Base.id, Osmosis.id, Neutron.id];
const withNoble = [Base.id, Noble.id, Neutron.id];
const usdFour = [Base.id, Osmosis.id, Noble.id, Neutron.id];
const cosmoFour = [Base.id, Osmosis.id, CosmosHub.id, Neutron.id];

const solWithNoble = ["solana", Noble.id, Neutron.id];


const BaseUsdDestinations : Record<string, DestInfo> = {

    [AXL_USDC.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },

        go: {
            time: 30,
            feeUsd: 0.095,
            swap: true,
            chadresses: usdFour
        }
    },

    [NOBLE_USDC.denom]: {

        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },


        go: {
            time: 30,
            feeUsd: 0.1,
            swap: true,
            chadresses: usdFour
        }
    },

    [ATOM.denom]: {
        go: {
            time: 30,
            feeUsd: 0.042,
            chadresses: cosmoFour
        }
    },

    [NTRN.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.04,
            chadresses: withOsmo
        }
    },

    [ALL_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.045,
            chadresses: withOsmo
        }
    },

    [WST_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.05,
            chadresses: withOsmo
        }
    }
}


const BaseWethDestinations : Record<string, DestInfo> = {
    [AXL_USDC.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },
        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: usdFour
        }
    },

    [NOBLE_USDC.denom]: {
        nonGo: {
            time: 1110,
            feeUsd: 0.2,
            swap: false,
            chadresses: withNoble
        },
        go: {
            time: 30,
            feeUsd: 0.047,
            chadresses: usdFour
        }
    },

    [ATOM.denom]: {
        nonGo: {
            time: 1500,
            feeUsd: 0.20,
            chadresses: cosmoFour
        },
        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: cosmoFour
        }
    },

    [NTRN.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },
        go: {
            time: 20,
            feeUsd: 0.046,
            chadresses: withOsmo
        }
    },

    [ALL_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.0505,
            chadresses: withOsmo
        }
    },


    [WST_ETH.denom]: {

        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.047,
            chadresses: withOsmo
        }
    }
}

export const BaseEthDestinations : Record<string, DestInfo> = {

    [AXL_USDC.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            swap: false,
            onlyTwo: true,
        },
        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: usdFour
        }
    },

    [NOBLE_USDC.denom]: {

        nonGo: {
            time: 1110,
            feeUsd: 0.02,
            swap: false,
            chadresses: withNoble
        },

        go: {
            time: 30,
            feeUsd: 0.047,
            chadresses: usdFour
        }

    },

    [ATOM.denom]: {

        nonGo: {
            time: 1500,
            feeUsd: 0.20,
            chadresses: cosmoFour
        },

        go: {
            time: 30,
            feeUsd: 0.049,
            chadresses: cosmoFour
        }
    },

    [NTRN.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.0499,
            chadresses: withOsmo
        }
    },

    [ALL_ETH.denom]: {
        nonGo: {
            time: 1470,
            feeUsd: 0.2,
            onlyTwo: false,
            chadresses: withOsmo
        },

        go: {
            time: 20,
            feeUsd: 0.05,
            chadresses: withOsmo
        }
    },


    [WST_ETH.denom]: {
        nonGo: {
            time: 1440,
            feeUsd: 0.2,
            onlyTwo: true
        },

        go: {
            time: 20,
            feeUsd: 0.05,
            chadresses: withOsmo
        },
    }

}



export const SolUsdcDestinations : Record<string, DestInfo> = {

    [NOBLE_USDC.denom]: {
        nonGo: {
            time: 150,
            feeUsd: 0.02,
            swap: false,
            chadresses: solWithNoble
        },

        go: {
            time: 150,
            feeUsd: 0.02,
            chadresses: solWithNoble
        }
    },
    

}


export const RouteMap : Record<string, Record<string, DestInfo>> = {

    [BASE_USDC.denom]: BaseUsdDestinations,

    [BASE_WETH.denom]: BaseWethDestinations,

    [BASE_ETH.denom]: BaseEthDestinations,

    [SOLANA_USDC.denom]: SolUsdcDestinations,
}   


export const BaseUniswapVenue : SwapVenue = {
    chainID: BASE_ID,
    name: "base-uniswap",
    logoUri: "https://raw.githubusercontent.com/Uniswap/brand-assets/main/Uniswap%20Brand%20Assets/Uniswap_icon_pink.svg"
};

export const AstroportVenue  : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-astroport",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/astroport/logo.png"
};

export const LidoSatelliteVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-lido-satellite",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/lido-satellite/logo.png"
};


export const DualityVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-duality",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/duality/logo.png"
};


export const NeutronDropVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-drop",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/drop/logo.png"
};

export const NeutronAstrovaultVenue : SwapVenue = {
    chainID: NEUTRON_ID,
    name: "neutron-astrovault",
    logoUri: "https://raw.githubusercontent.com/skip-mev/skip-go-registry/main/swap-venues/astrovault/logo.png"
};


export const AllNeutronVenues = [AstroportVenue, LidoSatelliteVenue, DualityVenue, NeutronDropVenue, NeutronAstrovaultVenue];



export const directRes = writable<MsgsDirectResponse | null>(null);



export const updateRoutePrices = async (values: RouteValues) => {
    values.inPrice ||= await getPrice(values.inToken.meta.geckoName);
    values.outPrice ||= await getPrice(values.outToken.meta.geckoName);
    routeValues.set(values);
    return values;
}



export const setRouteValues = async (
    values              : RouteValues, 
    newRoute            : RouteResponse,
    creationFeeCoin?    : FullCoin
) => {
    console.log('setting route values', newRoute);

    values = await updateRoutePrices(values);
    values.inParsed = BigInt(newRoute.amountIn);
    values.outParsed = BigInt(newRoute.amountOut);

    const newIn = parseFloat(formatUnits(values.inParsed, values.inToken.decimals));
    const newOut = parseFloat(formatUnits(values.outParsed, values.outToken.decimals));
    const outUsd = newOut * values.outPrice;

    values.inUSD = (newIn * values.inPrice).toFixed(2);
    values.outUSD = outUsd.toFixed(2);
    values.outOriginal = (outUsd / values.inPrice);
    values.routeSecs = newRoute.estimatedRouteDurationSeconds;
    values.outValue = newOut;

    values.userAddresses = newRoute.requiredChainAddresses.map((chainID) => ({
      chainID,
      address: idToChain(chainID, true)
    }));

    return await updateBridgeFee(values, newRoute.estimatedFees, creationFeeCoin);
}


export const setDirectResponse = async (
    values   : RouteValues,
    direct   : MsgsDirectResponse, 
    address  : string,
    chainID  : string = BASE_ID,
    relayer? : SigningCosmWasmClient,
    creationFeeCoin? : FullCoin
) => {
    console.log('setting direct response', direct);
    if (direct.txs.length != 1) {
        throw new Error('Direct response must have one tx');
    }
    directRes.set(direct);
    const tx = direct.txs[0];
    
    values = await setRouteValues(values, direct.route, creationFeeCoin)
    return await updateGasFee(values, tx, address, chainID, relayer, creationFeeCoin)
}

    



export const executeRoute = async (
    client: SkipClient,
    txs: Tx[],
    route: RouteResponse,
    values: RouteValues,
    cosmosClient: CosmosClient
) => {

    return client.executeTxs({
        txs, 
        route,
        userAddresses: values.userAddresses,

        onTransactionCompleted: async (chainID, txHash, txStatus) => {
            console.log(`Route completed status on chainID ${chainID}:`, txStatus);
            updateBridgeTask(txHash, { txStatus });
            updateAccounts(cosmosClient, values.userAddresses.find((addr) => addr.chainID === chainID)!.address);
        },
        
        onTransactionBroadcast: async ({ txHash }) => {
            console.log(`Transaction broadcasted with tx hash: ${txHash}`);

            bridgeTasks.update(tasks => {
                const task : BridgeTask = {
                    inAddress: NEUTRON_REGISTRY,
                    inAmount: values.inValue.toString(),
                    inToken: values.inToken,
                    txId: txHash,

                    outAmount: values.outValue.toString(),
                    outToken: values.outToken,
                    outAddress: "",
                    outChainId: "",
                    status: "broadcasted",
                    bridgeType: "IBC",
                    accCreation: false
                }
                tasks.push(task);
                return tasks;
            });
        },
        onTransactionTracked: async ({ txHash, explorerLink }) => {
            console.log(`Transaction tracked with tx hash: ${txHash}`);
            updateBridgeTask(txHash, { explorerLink });
        },
    });

}





export const calculateCosmosTxs = async (
    client: SigningCosmWasmClient,
    address: string,
    direct : MsgsDirectResponse,
    account: ParsedAccountInfo,
    returnDirect: boolean = false
  ) => {
    
    const { multiChainMsg } = direct.msgs[0] as { multiChainMsg: MultiChainMsg };

    const actions : AccountAction[] = [];

    const parsed = camelizeObject(JSON.parse(multiChainMsg.msg));
    console.log('parsed', parsed);

    if (multiChainMsg.msgTypeURL == MsgTransfer.typeUrl) {
      const tr : MsgTransfer = MsgTransfer.fromJSON(parsed)

      const ibc : NeutronMsg = {
        custom: {
          ibc_transfer: {
            token: tr.token,
            source_channel: tr.sourceChannel,
            receiver: tr.receiver,
            memo: tr.memo,
            timeout_timestamp: Number(tr.timeoutTimestamp),
            sender: account.address,
            source_port: tr.sourcePort,
            timeout_height: {},
            fee: {
              receive_fee: coins(0, NEUTRON_DENOM),
              ack_fee: coins(100000, NEUTRON_DENOM),
              timeout_fee: coins(100000, NEUTRON_DENOM),
            }
          }
        }
      }
      actions.push({ execute: { msgs: [ibc] } });

    } else if (multiChainMsg.msgTypeURL == MsgExecuteContract.typeUrl) {

      const msg : CosmosMsg = {
        wasm: {
          execute: {
            funds: parsed.funds,
            contract_addr: parsed.contract,
            msg: toBinary(parsed.msg),  
          }
        }
      }
      actions.push({ execute: { msgs: [msg] } });
    
    } else if (multiChainMsg.msgTypeURL == MsgSend.typeUrl) {
      const msg : CosmosMsg = {
        bank: {
          send: {
            amount: parsed.amount,
            to_address: parsed.toAddress
          }
        }
      }
      actions.push({ execute: { msgs: [msg] } });
    } else {
      console.error('Unknown msg type', multiChainMsg.msgTypeURL);
      return [];
    }

    const wasmMsg = await executeAccountActions(
      client,
      address,
      account,
      actions,
      "",
      true
    ) as MsgExecuteContractEncodeObject;

    console.log('wasmMsg', wasmMsg);

    const cosmosTx : CosmosTx = {
      chainID: NEUTRON_ID,
      signerAddress: address,
      path: multiChainMsg.path,
      msgs: [{
        msg: JSON.stringify(wasmMsg.value),
        msgTypeURL: wasmMsg.typeUrl,
      }]
    }

    const txs = [{ cosmosTx, operationsIndices: direct.txs[0].operationsIndices }]

    return returnDirect ? { ...direct, txs } : txs
}






export const updateBridgeFee = (
    values              : RouteValues,
    fees                : EstimatedFee[],
    creationFeeCoin?    : FullCoin
) => {
    console.log('updating bridge fee', fees);
    const token = values.inToken;
    const feeLength = fees.length;
    values.bridgeParsed = BigInt(0);
    values.bridgeValue = "";
    values.bridgeUSD = 0;

    console.log('bridge fee inPrice', values.inPrice);
    
    for (const fee of fees) {
        const denom = fee.originAsset.denom;

        if (fee.usdAmount) values.bridgeUSD += parseFloat(fee.usdAmount);

        if (feeLength == 1) {
            values.bridgeToken = AllTokensMap[denom];
            console.log('bridge token', values.bridgeToken);
            values.bridgeParsed = BigInt(fee.amount);
            values.bridgeValue = parseFloat(
                formatUnits(values.bridgeParsed, values.bridgeToken.decimals)
            ).toString();
        } 
    }
    console.log('bridge fee loop', values.bridgeValue, values.bridgeUSD);

    if (!values.bridgeValue && values.inPrice && values.bridgeUSD) {
        values.bridgeValue = (values.bridgeUSD / values.inPrice).toString();
        values.bridgeParsed = parseUnits(values.bridgeValue, token.decimals);
    }
    console.log('bridge fee from usd', values.bridgeValue, values.bridgeUSD);

    values.bridgeToken ??= token;
    values.bridgeValue = values.bridgeValue ? formatValue(values.bridgeValue, values.bridgeToken) : "";


    console.log('bridge fee formatted', values.bridgeValue, values.bridgeUSD);

    const totalUsd = values.bridgeUSD 
        + parseFloat(values.gasUSD ?? "0") 
        + (creationFeeCoin ? parseFloat(creationFeeCoin.amount) : 0);

    const value = totalUsd / (values.inPrice || 1);

    values.totalFeeUSD = totalUsd.toFixed(3);
    values.totalFeeValue = formatValue(value, token);
    values.totalFeeParsed = parseUnits(value.toString(), token.decimals);

    routeValues.set(values);
    return values;
}


export const updateGasFee = async (
    values: RouteValues,
    tx: Tx,
    address: string,
    chainID: string,
    relayer? : SigningCosmWasmClient,
    creationFeeCoin?  : FullCoin
) => {
    const token = values.inToken;
    values.gasParsed = BigInt(0);
    values.gasValue = "";
    values.gasUSD = "0";

    const gasToken = chainID == BASE_ID ? BASE_ETH : NTRN;
    

    if ('evmTx' in tx) {
        const evmTx = tx.evmTx;
        console.log('evmTx', evmTx);
        const client = await getEthClient(chainID);

        const gas = await estimateGas(client, {
            to: evmTx.to as `0x${string}`,
            data: `0x${evmTx.data}`,
            account: address as `0x${string}`,
            value: BigInt(evmTx.value),
        })

        const gasPrice = await getEthGasPrice(client, chainID)
        const fee = gas * BigInt(gasPrice);
        const hum = parseFloat(formatUnits(fee, 18));

        values.gasUSD = (hum * values.inPrice).toString();
        values.gasValue = formatValue(hum, BASE_ETH);
        values.gasParsed = fee;


    } else if ('cosmosTx' in tx) {
        const cosmosTx = tx.cosmosTx;
        console.log('gas for cosmosTx', cosmosTx);

        if (relayer) {
            console.log('simulating cosmos tx');
            const msg = cosmosTx.msgs[0];
            const parsed = JSON.parse(msg.msg); 
            console.log('parsed', parsed);

            const value = MsgExecuteContract.fromPartial({
                contract: parsed.contract,
                msg: toUtf8(JSON.stringify(parsed.msg)),
                sender: parsed.sender,
                funds: parsed.funds
            })
            
            const simulated = await relayer.simulate(
                cosmosTx.signerAddress,
                [{
                    typeUrl: msg.msgTypeURL,
                    value
                }],
                ""
            )
            console.log('simulated', simulated);
            const fee = simulated * 0.02;
            console.log('cosmos fee', fee);

            values.gasParsed = BigInt(Math.round(fee));
            const hum = parseFloat(formatUnits(values.gasParsed, 6));

            values.gasValue = hum.toString();
            console.log('cosmos gas fee', values.gasValue);

            const ntrnPrice = await getPrice(NTRN_INPUT.geckoName);
            values.gasUSD = (ntrnPrice * hum).toString();
            console.log('cosmos gas usd', values.gasUSD);
        }

    } else {
        console.error('Unknown tx type:', tx);
    }

    console.log('gas fee', values.gasUSD);
    console.log('bridge fee', values.bridgeUSD);
    console.log('creation fee', creationFeeCoin?.amountUsd);

    const totalUsd = parseFloat(values.gasUSD) 
        + (values.bridgeUSD || 0) 
        + (creationFeeCoin ? parseFloat(creationFeeCoin.amountUsd) : 0);

    console.log('total usd', totalUsd);

    const value = totalUsd / (values.inPrice || 1);

    values.gasUSD = parseFloat(values.gasUSD).toFixed(2);

    values.totalFeeUSD = totalUsd.toFixed(3);
    values.totalFeeValue = formatValue(value, gasToken);
    values.totalFeeParsed = parseUnits(value.toString(), token.decimals);

    routeValues.set(values);
    return values;
}