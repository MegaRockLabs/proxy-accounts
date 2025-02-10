<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  
  import { selectedChain } from '$lib/chains';
  import { getModalStore, ListBox, ListBoxItem, popup, type PopupSettings } from "@skeletonlabs/skeleton";
  
  import type { BridgeType, EstimatedFee, RouteResponse, SwapVenue } from '@skip-go/client';
  import type { Chain, CosmosToken, Token } from '$lib/types';
  
  import { BASE_ID, NEUTRON_ID, SKIP_COMMON, SOLANA_ID } from '$lib/vars';
  import { getSourceTokens, getDestinationTokens } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, skipClient } from '$lib/clients';
  import { formatEther, formatUnits, parseUnits } from 'viem';
  import { getPrice as getTokenPrice } from '$lib/prices';
  import { getEthBalance, getSolBalance, updateAccountBalances } from '$lib/assets';
  import { address } from '$lib/appkit';
  import { wagmiAdapter } from '$lib/signers';
  import { AstroportVenue, BaseUniswapVenue } from '$lib/routes';
  import { bridgeTasks, updateBridgeTask, type BridgeTask } from '$lib';
  import { idToChain } from '$lib/utils';

  export let parent: any = {} 
  if (parent) {}

  formatEther
	const modalStore = getModalStore();


  let loading = false;
  let loadingOut = false;
  
  let inChain : Chain;
  let inTokens : Token[] = [];
  let inToken : Token;
  let inValue : number = 0;
  let inPrice : number = 0;
  let inUSD : number = 0;
  let inBalance : string = "0";

  let outTokens : CosmosToken[] = [];
  let outToken : CosmosToken = outTokens[0];
  let outValue : number = 0;
  let outPrice : number = 0;
  let outUSD : number = 0;
  let outOriginal : number = 0;

  let bridgeValue : number = 0;
  let bridgeUSD : number = 0;

  let gasFeeValue : number = 0;
  let gasFeeUSD : number = 0;

  let goFast : boolean = true;
  let lastRoute : RouteResponse | null = null;
  let routeTxs : number = 0;
  let routeSecs : number = 0;

  let fromIn : boolean = true;
  let requiredAddresses : string[] = [];

  $: inParsed = inToken ? parseUnits(inValue.toString(), inToken.decimals).toString() : "0";

  const isRouteSame = () => {
    return lastRoute &&
      lastRoute.sourceAssetChainID == inToken.originalChain &&
      lastRoute.sourceAssetDenom == inToken.denom &&
      lastRoute.destAssetDenom == outToken.denom
  }

  // 0.00007381847388687
  
  const resetRouteValues = () => {
    fromIn = true;
    loading = false;
    routeSecs = 0;
    routeTxs = 0;
    outOriginal = 0;
    bridgeValue = 0
    bridgeUSD = 0;
    requiredAddresses = [];

    if (!inPrice || !outPrice) updatePrices();

    if (!isRouteSame() || lastRoute?.amountIn.length != inParsed.length) {
      gasFeeValue = 0;
      gasFeeUSD = 0;
    }
  }

  const updateOutToken = async (token: CosmosToken, assign: boolean = true) => {
    if (assign) {
      outToken = token;
      outValue = 0;
    } else {
      //outValue = token.meta.default;
    }
    if (outToken.meta.isUsd) {
      outPrice = 1;
    } else {
      outPrice = await getTokenPrice(outToken.meta.geckoName)
    }
  } 

  $: console.log('inBalance', inBalance, inToken?.name)

  const updateInToken = async (token: Token, assign: boolean = true) => {
    if (assign) {
      inToken = token;
    }
    if (inChain.id == SOLANA_ID) {
      getSolBalance(token.denom).then(balance => inBalance = balance);
    } else {
      const tokenAddr = token.symbol == "ETH" ? token.symbol : token.denom;
      getEthBalance($wagmiAdapter, inChain.id, $address, tokenAddr)
        .then(balance => inBalance = balance);
    }
    fromIn = true;
    inValue = inToken.meta.default;
    outTokens = getDestinationTokens(inToken);
    updateOutToken(outTokens[0]);
    if (inToken.meta.isUsd) {
      inPrice = 1;
    } else {
      inPrice = await getTokenPrice(inToken.meta.geckoName)
    }
  }

  const updateChain = async (chain: Chain) => {
    inChain = chain;
    inTokens = getSourceTokens(inChain);
    updateInToken(inTokens[0]);
  }


  const updateUsds = () => {
    console.log('updating usds')
    inUSD = inValue * inPrice;
    outUSD = outValue * outPrice;
    gasFeeUSD = gasFeeValue * inPrice;
    const big = parseUnits(bridgeValue.toString(), inToken.decimals)
    bridgeUSD = Number(big) * inPrice;
  }


  

  const updatePrices = async () => {
    if (inToken.meta.isUsd) {
      inPrice = 1;
    } else {
      inPrice = await getTokenPrice(inToken.meta.geckoName)
    }
    if (outToken.meta.isUsd) {
      outPrice = 1;
    } else {
      outPrice = await getTokenPrice(outToken.meta.geckoName)
    }
  }

  
  const updateBridgeFee = (fees: EstimatedFee[]) => {
    const feeLength = fees.length;
    for (const fee of fees) {
      const denom = fee.originAsset.denom;
      bridgeUSD += parseFloat(fee.usdAmount);
      if (feeLength == 1 && 
        (denom == inToken.denom || 
          (inToken.meta.isEth && denom.endsWith("-native")
        )) 
      ) {
        bridgeValue = parseFloat(formatUnits(BigInt(fee.amount), inToken.decimals));
      } 
    }
    if (!bridgeValue) {
      bridgeValue = bridgeUSD / inPrice;
    }
  }


  let userAddresses : { chainID: string, address: string }[];
  


  const calculateDirectMessages = async () => {

    const account = $foundAccountInfo;
    if (!account) return;

    try {

      let swapVenues: SwapVenue[] | undefined = undefined;
      let bridges: BridgeType[] | undefined = undefined;

      if (goFast) {

      } else {
        if (inChain.id == BASE_ID && outToken.denom == "untrn") {
          swapVenues = [BaseUniswapVenue, AstroportVenue]
        }
      }
      

      const withPostMsgs = await $skipClient.msgsDirect({
        ...SKIP_COMMON,
        destAssetChainID: NEUTRON_ID,
        destAssetDenom: outToken.denom,
        sourceAssetDenom: inToken.denom,
        sourceAssetChainID: inToken.originalChain,
        amountIn: inParsed,
        slippageTolerancePercent: "8",
        swapVenues,
        bridges,
        goFast,
        chainIdsToAddresses: {
          [NEUTRON_ID]: account.address,
          "noble-1": "noble16z43tjws3vw06ej9v7nrszu0ldsmn0eywvs50c",
          "osmosis-1": "osmo16z43tjws3vw06ej9v7nrszu0ldsmn0eyw5kvpy",
          "cosmoshub-4": "cosmos16z43tjws3vw06ej9v7nrszu0ldsmn0eyx09uhk",
          [inToken.originalChain]: $address,
        },
      });

      console.log('message direct', withPostMsgs);

      const route = withPostMsgs.route;

      const newIn = formatUnits(BigInt(route.amountIn), inToken.decimals).toString();
      const newOut = formatUnits(BigInt(route.amountOut), outToken.decimals).toString();

      inValue = parseFloat(newIn);
      outValue = parseFloat(newOut);
      outUSD = outValue * outPrice;
      inUSD = inValue * inPrice;
  
      // calculate how much out in original token using inPrice
      outOriginal = (outUSD / inPrice);
      routeSecs = route.estimatedRouteDurationSeconds;
      lastRoute = route;

      userAddresses = lastRoute.requiredChainAddresses.map((chainID) => ({
        chainID,
        address: chainID == NEUTRON_ID ? account.address : idToChain(chainID)
      }));

      $skipClient.executeTxs({
        txs: withPostMsgs.txs,
        route: withPostMsgs.route,
        userAddresses,
        // afterMsg: after.multiChainMsg,
        onTransactionCompleted: async (chainID, txHash, txStatus) => {
          console.log(
            `Route completed status on chainID ${chainID}:`, txStatus
          );
          updateBridgeTask(txHash, { txStatus });
          updateAccountBalances($cosmosClient, $foundAccountInfo?.address ?? "");

        },
        onTransactionBroadcast: async ({ txHash, chainID }) => {
          console.log(`Transaction broadcasted with tx hash: ${txHash}`);

          bridgeTasks.update(tasks => {
            const task : BridgeTask = {
              inAddress: $address,
              inAmount: inValue.toString(),
              inToken: inToken,
              txId: txHash,

              outAmount: outValue.toString(),
              outToken: outToken,
              outAddress: account.address,
              outChainId: NEUTRON_ID,

              status: "broadcasted",
              bridgeType: "AXELAR",
              accCreation: true
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
      console.error('Error calculating  post messages', e);
    }
  }


  const deposit = () => {
    console.log('depositing')
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


  // detect which out of the values was changed last
  $: if (inValue) fromIn = true;
  $: if (outValue) fromIn = false;


  $: if (inToken || outToken) updatePrices()

  // update USD values for all values  
  $: if ((inValue || outValue) && inPrice && outPrice) updateUsds()

  // reset all available tokens on chain change
  $: if ($selectedChain) updateChain($selectedChain)

</script>


<div data-popup="payTokens" class="card shadow-xl z-50 bg-surface-backdrop-token">
  
  <ListBox rounded="rounded-none" active="">

    { #each inTokens as token (token.denom)}
      
      <ListBoxItem bind:group={inToken} name="intoken" value={token} on:change={() => updateInToken(token, false)}>
        <div class="flex gap-5 justify-between items-center ">
          <img src="{token.meta.logo}" alt="{token.symbol} logo" class="w-5 h-5" />
          <div class="flex w-full justify-center">
            {token.fullName}
          </div>
        </div>
      </ListBoxItem>

    { /each }

  </ListBox>

</div>  


<div data-popup="recieveTokens" class="card shadow-xl z-50 bg-secondary-backdrop-token">

  <ListBox rounded="rounded-none" >

    { #each outTokens as token (token.denom)}

      <ListBoxItem bind:group={outToken} name="outoken" value={token} on:change={() => updateOutToken(token, false)}>
        <div class="flex gap-5 justify-between items-center">
          <img src="{token.meta.logo}" alt="{token.symbol} logo" class="w-5 h-5" />
          <div class="flex w-full justify-center">
            {token.fullName}
          </div>
        </div>
      </ListBoxItem>

    { /each }

  </ListBox>

</div>  


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 px-5">

  <ElevatedBox styles="p-3"><h3 class="text-md font-bold">Deposit</h3></ElevatedBox>


    <div class="py-5 pb-3 px-3 flex flex-col justify-between gap-5">

      <div class="border border-grey-100 rounded-container-token relative">
        <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="pay">Pay</label>
        { #if !inToken.meta.isUsd }
          <span class="absolute bottom-2 left-7 label text-xs text-gray-200 ">( ${inUSD.toFixed(2)} )</span>
        {/if}
        <div class="flex w-full justify-between items-stretch ">
          <input 
            id="pay" type="number" class="p-7 flex w-full bg-transparent border-none text-lg" 
            step={inToken.meta.step ?? inToken.meta.min} min={inToken.meta.min} bind:value={inValue}
          />
          <button class="btn variant-ghost-primary w-48 gap-2 justify-center items-center px-5" use:popup={payTokens}>
            <img src="{inToken.meta.logo}" alt="{inToken.name} logo" class="w-8 h-8" />
            <div class="flex flex-col gap-2">
              <span>{inToken.symbol}</span>
              <span class="text-xs text-zinc-300">{$selectedChain.name}</span>
            </div>
            <span class="material-icons-round">arrow_drop_down</span>
          </button> 
        </div>
      </div>

      <div class="border border-grey-100 rounded-container-token relative">
        <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="recieve">Recieve</label>
        <div class="flex w-full justify-between items-stretch ">
          <input 
            id="recieve" type="number" class="p-7 flex w-full bg-transparent border-none text-lg" 
            step="0.1" min={outToken.meta.min} bind:value={outValue}
          />
          { #if outUSD }
            <span class="absolute bottom-2 left-7 label text-xs text-gray-200 ">( ${outUSD.toFixed(2)} )</span>
          {/if}
          <button class="btn variant-ghost-primary w-48  gap-2 justify-center items-center px-5" use:popup={recieveTokens}>
            <img src="{outToken.meta.logo}" alt="{outToken.name}logo" class="w-8 h-8" />
            <div class="flex flex-col gap-2">
              <span>{outToken.symbol}</span>
            </div>
            <span class="material-icons-outlined">arrow_drop_down_circle</span>
          </button>
        </div>
      </div>
   

      <div>

        <ElevatedButtonBox onClick={calculateDirectMessages} >
          Calculate Direct
        </ElevatedButtonBox>
      </div>



      <!--  

      <div class="border-t border-b border-zinc-400 bg-primary-backdrop-token py-5 px-7 flex flex-col gap-5 ">
        

        <div class="flex justify-between items-baseline gap-4">
          <div>Bridging fee</div>

          <div class="flex flex-col items-stretch gap-3 ">

            <div class="flex items-center justify-between gap-3 ">
              <img src="{inToken.meta.logo}" alt="send token logo" class="w-5 h-5" />
              <div class="flex flex-col gap-1 items-center w-full">
                { #if inToken.meta.isEth && bridgeValue.toString().length > 5 }
                  {@const form = formatEth(bridgeValue)}
                    <span>{form.value}</span>
                    <div class="text-xs text-gray-200 " >
                      {form.unit}(10<sup>{form.power}</sup>)
                    </div>
                { :else }
                  <span>{bridgeValue}</span>
                {/if}
              </div>
            </div>

            {#if !inToken.meta.isUsd  && bridgeUSD != 0 }
              <div class="flex items-center justify-between gap-3 mt-2  ">
                <img src="{LOGO_USDC}" alt="usdc logo" class="w-5 h-5" />
                <div class="flex flex-col gap-1 items-center w-full">
                  <span>{bridgeUSD.toFixed(2)}$</span>
                </div>
              </div>
            {/if}

          </div>
        </div>
        
       <div class="border-t border-white/10 flex justify-between items-center pt-4 gap-4">
          <div>Account Address</div>
          <div class="flex justify-between items-center gap-4">
            <span>{formatAddress($foundAccountInfo?.address ?? "", 10)}</span>
          </div>
        </div> 

        { #if  routeSecs > 0 }
          <div class="border-t border-white/10 flex justify-between items-center pt-4 gap-4">
            <div>Estimated Time</div>
            <div class="flex justify-between items-center gap-4">
              <span>{formatTimeHIS(routeSecs)}</span>
            </div>
          </div>
        {/if}

        
      </div>

    </div>
    
    -->

    <div class="my-5 border-t border-white/20"></div>

    <div class="flex justify-between items-center px-2">
      <div class="flex gap-2">
        <ElevatedButtonBox selected onClick={clickCancel}>Cancel</ElevatedButtonBox>
        <ElevatedButtonBox onClick={deposit} >
          Deposit
        </ElevatedButtonBox>
      </div>
  </div>
</GhostBox>
