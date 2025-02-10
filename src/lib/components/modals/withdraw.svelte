<script lang="ts">
	import { fromHex, toBase64, toUtf8 } from '@cosmjs/encoding';
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  
  import { selectedChain } from '$lib/chains';
  import { getModalStore, ListBox, ListBoxItem, popup, ProgressRadial, type PopupSettings } from "@skeletonlabs/skeleton";
  
  import type { AccountAction, Chain, CosmosMsg, CosmosToken, Token, NeutronMsg } from '$lib/types';
  import { NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY, SKIP_COMMON } from '$lib/vars';
  import { NeutronTokenMap, BASE_WETH, BASE_USDC, BASE_AXL_USDC, BASE_ETH } from '$lib/tokens';
  
  import { executeAccountActions, foundAccountInfo, updateAccounts } from '$lib/accounts';
  import { type CosmosTx, type MsgsDirectRequest, type MsgsDirectResponse, type MsgsRequest, type MultiChainMsg, type RouteRequest, type RouteResponse, type Tx } from '@skip-go/client';
  import { cosmosClient, relayingClient, skipClient } from '$lib/clients';
  import { formatUnits, parseUnits } from 'viem';
  import { getPrice as getTokenPrice } from '$lib/prices';
  import { accountBalances } from '$lib/assets';
  import { address } from '$lib/appkit';
  import { getWagmiConnector, relayingAddress, wagmiAdapter } from '$lib/signers';
  import { signMessage } from '@wagmi/core';
  import type { Credential } from 'smart-account-auth';
  import { coins } from '@cosmjs/stargate';
  import { bridgeTasks, updateBridgeTask, type BridgeTask } from '$lib';
  import { camelizeObject, idToChain } from '$lib/utils';
  import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
  import type { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
  import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
  import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';

  export let parent: any = {} 
  if (parent) {}

  const modalStore = getModalStore();


  let inChain : Chain;
  let inTokens : CosmosToken[] = [];
  let inBalances : { [key: string]: string } = {};

  let inToken : CosmosToken;

  let inValue : number = 0;
  let inBalance : number = 0;

  let inParsed : bigint = BigInt(0);
  let inBalanceParsed : bigint = BigInt(0);

  let inDecimals : number = 6;
  let inPrice : number = 0;

  let inUSD : number = 0;
  let inBalanceUSD : number = 0;

  let outAddress = $address
  let outTokens : (Token | CosmosToken)[] = [];
  let outToken : (Token | CosmosToken) = outTokens[0];
  let outDenom  : string;

  let outValue : number = 0;
  let outPrice : number = 0;
  let outUSD : number = 0;
  let outOriginal : number = 0;

  let bridgeValue : number = 0;
  let bridgeUSD : number = 0;

  let gasFeeValue : number = 0;
  let gasFeeUSD : number = 0;

  let goFast : boolean = true;
  let lastRoute : MsgsDirectResponse | null = null;
  let routeSecs : number = 0;


  let loading = false;


  $: if (inToken && inValue) inParsed = parseUnits(inValue.toString(), inDecimals)


  const updateOutToken = async (token: Token | CosmosToken, assign: boolean = true) => {
    if (assign) {
      outToken = token;
    } 
    outValue = 0;

    if ('address' in token) {
      outDenom = token.denom;
    } else {
      outDenom = token.denom;
    }
    if (outToken.meta.isUsd) {
      outPrice = 1;
    } else {
      outPrice = await getTokenPrice(outToken.meta.geckoName)
    }
  } 

  const updateInToken = async (token: CosmosToken, assign: boolean = true) => {
    if (assign) {
      inToken = token;
    } 
    inDecimals = token.decimals;
    
    const bal = inBalances[token.denom];

    inBalanceParsed = BigInt(bal ?? 0);
    inBalance = parseFloat(formatUnits(inBalanceParsed, inDecimals));

    inValue = bal ? inBalance : token.meta.default;
    if (token.meta.isUsd) {
      inPrice = 1;
    } else {
      inPrice = await getTokenPrice(token.meta.geckoName)
    }
  }

  const updateToAddress = (address: string) => {
    outAddress = address;

    if (outAddress.startsWith('0x') && outAddress.length == 42) {
      outTokens = [BASE_WETH, BASE_ETH, BASE_USDC, BASE_AXL_USDC];
      updateOutToken(BASE_WETH);
    } else if (outAddress.startsWith('neutron1')) {
      console.log('updating out tokens');
      // TODO: get tokens from chain
      outTokens = Object.values(NeutronTokenMap);
      updateOutToken(outTokens[0]);
    } else {
      outTokens = [];
    }
  }

  const updateChain = async (chain: Chain) => {
    inChain = chain;
    const balances = $accountBalances;
    if (balances.length == 0) return;
    inBalances = balances.reduce((acc, token) => {
      acc[token.denom] = token.amount;
      return acc;
    }, {} as Record<string, string>);

    inTokens = balances.map((token) => NeutronTokenMap[token.denom]);
    updateInToken(inTokens[0]);
  }


  const updateUsds = () => {
    inUSD = inValue * inPrice;
    outUSD = outValue * outPrice;
    gasFeeUSD = gasFeeValue * inPrice;
    inBalanceUSD = inBalance * inPrice;
    const big = parseUnits(bridgeValue.toString(), inToken.decimals)
    bridgeUSD = Number(big) * inPrice;
  }



  const updatePrices = async () => {
    if (inToken.meta.isUsd) {
      inPrice = 1;
    } else {
      inPrice = await getTokenPrice(inToken.meta.geckoName)
    }

    if (outToken) {
      if (outToken.meta.isUsd) {
        outPrice = 1;
      } else {
        outPrice = await getTokenPrice(outToken.meta.geckoName)
      }
    }
  }

  
  let userAddresses : { chainID: string, address: string }[];


  const setRouteValues = (route : RouteResponse) => {

    console.log('setting route values', route);

    const newIn = formatUnits(BigInt(route.amountIn), inToken.decimals).toString();
    const newOut = formatUnits(BigInt(route.amountOut), outToken.decimals).toString();

    inValue = parseFloat(newIn);
    outValue = parseFloat(newOut);
    outUSD = outValue * outPrice;
    inUSD = inValue * inPrice;

    // calculate how much out in original token using inPrice
    outOriginal = (outUSD / inPrice);
    routeSecs = route.estimatedRouteDurationSeconds;

    console.log('inUSD', inUSD, 'outUSD', outUSD, 'bridgeUSD', bridgeUSD);

    userAddresses = route.requiredChainAddresses.map((chainID) => ({
      chainID,
      address: idToChain(chainID, true)
    }));

    console.log('userAddresses', userAddresses);

    routeSecs = route.estimatedRouteDurationSeconds;

  }

  const calculateTxs = async () => {
    const account = $foundAccountInfo
    if (!lastRoute || !account) return [];

    loading = true;

    const { multiChainMsg } = lastRoute.msgs[0] as { multiChainMsg: MultiChainMsg };

    const actions : AccountAction[] = [];

    const parsed = camelizeObject(JSON.parse(multiChainMsg.msg));
    console.log('parsed', parsed);

    if (multiChainMsg.msgTypeURL == MsgTransfer.typeUrl) {
      const tr : MsgTransfer = MsgTransfer.fromJSON(parsed)
      console.log('ibc msg decoded', tr);

      const route = lastRoute.route;
      setRouteValues(route);

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
      console.log('ibc', ibc);
      actions.push({ execute: { msgs: [ibc] } });

    } else if (multiChainMsg.msgTypeURL == MsgExecuteContract.typeUrl) {

      const msg : CosmosMsg = {
        wasm: {
          execute: {
            funds: parsed.funds,
            contract_addr: parsed.contract,
            msg: JSON.stringify(parsed.msg),  
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
      $relayingClient,
      $relayingAddress,
      account,
      actions,
      "",
      true
    ) as MsgExecuteContractEncodeObject;

    console.log('wasmMsg', wasmMsg);

    const cosmosTx : CosmosTx = {
      chainID: NEUTRON_ID,
      signerAddress: $relayingAddress,
      path: multiChainMsg.path,
      msgs: [{
        msg: JSON.stringify(wasmMsg.value),
        msgTypeURL: wasmMsg.typeUrl,
      }]
    }

    return [{ cosmosTx, operationsIndices: lastRoute.txs[0].operationsIndices }];
  }

  const withdraw = async () => {
    if (!lastRoute) return;

    loading = true;
    try {
      const txs = await calculateTxs();
  
      $skipClient.executeTxs({
        txs, 
        route: lastRoute.route,
        userAddresses,
        // afterMsg: after.multiChainMsg,
        onTransactionCompleted: async (chainID, txHash, txStatus) => {
          console.log(
            `Route completed status on chainID ${chainID}:`, txStatus
          );
          updateBridgeTask(txHash, { txStatus });
          updateAccounts($cosmosClient, 
          $address ?? "0xAc03048da6065e584d52007E22C69174CdF2b91a"
        );
  
        },
        onTransactionBroadcast: async ({ txHash }) => {
          console.log(`Transaction broadcasted with tx hash: ${txHash}`);
  
          bridgeTasks.update(tasks => {
            const task : BridgeTask = {
              inAddress: NEUTRON_REGISTRY,
              inAmount: inValue.toString(),
              inToken: inToken,
              txId: txHash,
  
              outAmount: outValue.toString(),
              outToken: outToken,
              outAddress: $address ?? "0xAc03048da6065e584d52007E22C69174CdF2b91a",
              outChainId: $selectedChain.id,
  
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

    } catch (e) {
      console.error('Error withdrawing', e);
    } finally {
      loading = false;
    }

  }

  const calculateDirectMessages = async () => {
    const chainIdsToAddresses = {
      [NEUTRON_ID]: "neutron16z43tjws3vw06ej9v7nrszu0ldsmn0eyzsv7d3",
      "noble-1": "noble16z43tjws3vw06ej9v7nrszu0ldsmn0eywvs50c",
      "osmosis-1": "osmo16z43tjws3vw06ej9v7nrszu0ldsmn0eyw5kvpy",
      [inChain.id]: "0xAc03048da6065e584d52007E22C69174CdF2b91a",
    };

    let destAssetChainID = outToken.originalChain; 
    console.log('destAssetChainID', destAssetChainID);

    if (outAddress.startsWith('neutron1')) {
      destAssetChainID = NEUTRON_ID;
    }

    chainIdsToAddresses[destAssetChainID] = outAddress;

    const account = $foundAccountInfo;
    if (!account) {
      console.error('No account info found');
      return;
    }

    loading = true;

    try {
 
      const dirReq: MsgsDirectRequest = {
        ...SKIP_COMMON,
        destAssetChainID,
        destAssetDenom: outDenom,
        sourceAssetDenom: inToken.denom,
        sourceAssetChainID: NEUTRON_ID,
        amountIn: inParsed.toString(),
        slippageTolerancePercent: "10",
        goFast,
        chainIdsToAddresses
      }

      console.log('dirReq', dirReq);
      
      const withPostMsgs = await $skipClient.msgsDirect(dirReq);
      console.log('withPostMsgs', withPostMsgs);
      
      setRouteValues(withPostMsgs.route);
      lastRoute = withPostMsgs

    } catch (e) {
      console.error('Error calculating  post messages', e);
    } finally {
      loading = false;
    }
  }

  const onClick = () => {
    if (!lastRoute) {
      calculateDirectMessages()
    } else {
      withdraw()
    }
  }

  const clickCancel = () => {
		modalStore.clear();
	};

  const payTokens: PopupSettings = {
    event: 'click',
    target: 'payTokens',
    placement: 'bottom',
    closeQuery: '.listbox-item'
  };

  const recieveTokens: PopupSettings = {
    event: 'click',
    target: 'recieveTokens',
    placement: 'bottom',
    closeQuery: '.listbox-item'
  };


  // reset bridge values on change if not calculating route
  //$: if (!loading && (inToken || outToken || inValue || outValue)) debounce(resetRouteValues)

  $: if (inToken || outToken) updatePrices()

  // update USD values for all values  
  $: if ((inValue || outValue || true) && inPrice && outPrice) updateUsds()


  // reset all available tokens on chain change
  $: if ($selectedChain) updateChain($selectedChain)

  $: if (outAddress) updateToAddress(outAddress)
    
  $: if (inToken || outToken || outAddress)  lastRoute = null;

</script>


<div data-popup="payTokens" class="shadow-xl z-50 bg-zinc-900/90">
  
  <ListBox rounded="rounded-none" active="bg-primary-active-token">

    { #each inTokens as token (token.denom)}
      
      <ListBoxItem 
        bind:group={inToken} name="intoken" 
        value={token} on:change={() => updateInToken(token)}
      >
        <div class="flex gap-5 justify-between items-center ">
          <img src="{token.meta.logo}" alt="{token.name} logo" class="w-5 h-5" />
          <div class="flex w-full justify-center">
            {token.fullName}
          </div>
        </div>
      </ListBoxItem>

    { /each }

  </ListBox>

</div>  


<div data-popup="recieveTokens" class="shadow-xl z-50 bg-zinc-900/90">
  
  <ListBox rounded="rounded-none" active="bg-primary-active-token">

    { #each outTokens as token }

      <ListBoxItem bind:group={outToken} name="outoken" value={token} on:change={() => updateOutToken(token, false)}>
        <div class="flex gap-5 justify-between items-center">
          <img src="{token.meta.logo}" alt="{token.name} logo" class="w-5 h-5" />
          <div class="flex w-full justify-center">
            {token.fullName}
          </div>
        </div>
      </ListBoxItem>

    { /each }

  </ListBox>

</div>  


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 md:px-5">

  <ElevatedBox styles="p-3"><h3 class="text-md font-bold">Withdraw</h3></ElevatedBox>

  {#if inToken && outToken}

    <div class="pt-5 pb-3 px-1 md:px-3 flex flex-col justify-between gap-5">

      <div class="border border-grey-100 rounded-container-token relative">

        <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="pay">Pay</label>
        { #if inUSD }
          <span class="absolute bottom-2 left-7 text-xs text-gray-200 ">( ${inUSD.toFixed(2)} )</span>
        {/if}

        <div class="flex w-full justify-between items-stretch">
          
          <div class="relative w-full ">
      
            <input 
              id="pay" type="number" 
                class="p-7 flex w-full bg-transparent border-none text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              step={inToken.meta.min} min={inToken.meta.min} 
              max={inBalance || undefined}
              bind:value={inValue}
            />
          </div>

          <button class="btn bg-zinc-900/80 w-52 lg:w-56 gap-2 justify-center items-center px-7 md:px-5" use:popup={payTokens} disabled={inTokens.length <= 1}>
            <img src="{inToken.meta.logo}" alt="{inToken.name} logo" class="w-8 h-8" />
            <div class="flex flex-col gap-2">
              <span>{inToken?.symbol ?? ""}</span>
            </div>
            <span class="material-icons">arrow_drop_down</span>
          </button>

        </div>
        
      </div>


      <div class="border border-grey-100 rounded-container-token relative {outTokens.length ? "": "input-error"}">
        <label class="absolute top-2 left-2  text-xs text-gray-200 " for="to">Recipient</label>

        <input id="to" type="text" bind:value={outAddress}
          class="px-3 md:px-7 py-7 flex w-full bg-transparent border-none text-md">
      </div>

      { #if outTokens.length > 0 }
    
          <div class="border border-grey-100 rounded-container-token relative">
            <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="to">To</label>
            { #if outUSD }
                <span class="absolute bottom-2 left-7 label text-xs text-gray-200 ">( ${outUSD.toFixed(2)} )</span>
              {/if}
            <div class="flex w-full justify-between items-stretch">
              <input 
                id="to" type="number" 
                class="p-7 flex w-full border-none text-lg bg-transparent" 
                step="0.1" min={outToken.meta.min} bind:value={outValue} disabled
              />
              <button class="btn bg-zinc-900/80 w-52 lg:w-56 gap-2 justify-center items-center px-7 md:px-5" use:popup={recieveTokens} disabled={outTokens.length <= 1}>
                <img src="{outToken.meta.logo}" alt="{outToken.name}logo" class="w-8 h-8" />
                <div class="flex flex-col gap-2">
                  <span>{outToken?.symbol ?? ""}</span>
                </div>
                <span class="material-icons">arrow_drop_down</span>
              </button>
            </div>
          </div>
        
      {/if}
    
    <div class="my-5 border-t border-white/20"></div>

    <div class="flex justify-end items-center px-2">

      <div class="flex gap-5">

        <ElevatedButtonBox selected onClick={clickCancel} small={false}>Cancel</ElevatedButtonBox>

        <ElevatedButtonBox styles="variant-filled-primary" onClick={onClick} disabled={loading || !outTokens.length || !outToken } small={false}>
          {#if lastRoute }
            Withdraw
          { :else if loading }
            <ProgressRadial value={undefined} width="w-6" />
          {:else}
            Calculate
          {/if}
        </ElevatedButtonBox>
      </div>
    </div>
  </div>
  

  {/if}
    
</GhostBox>
