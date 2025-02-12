<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  import InTokens from '../common/inTokens.svelte';
  import OutTokens from '../common/outTokens.svelte';

  import { selectedChain } from '$lib/chains';
  import { getModalStore, ProgressRadial } from "@skeletonlabs/skeleton";
  
  import type { Chain, CosmosToken, Token } from '$lib/types';
  
  import { chainIdsToAddresses, NEUTRON_DENOM, NEUTRON_ID, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, getOutTokens } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, skipClient } from '$lib/clients';
  import { userAddress } from '$lib/accounts';
  import { directRes, executeRoute, setDirectResponse } from '$lib/routes';
  
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import { formatSeconds } from '$lib/utils';
  import FeeAccordion from '../common/feeAccordion.svelte';
  import { accountCreationFees } from '$lib/registry';

  export let parent: any = {} 
  if (parent) {}

	const modalStore = getModalStore();


  let loading = false;
  
  let inChain : Chain;
  let inTokens : Token[] = [];
  let outTokens : CosmosToken[] = [];

  let goFast : boolean = true;


  const updateChain = async (chain: Chain) => {
    inChain = chain;
    inTokens = getInTokens(inChain);
    outTokens = getOutTokens(inChain);
    updateInToken($routeValues ?? {}, inTokens[0])
    .then(val => {
      if (outTokens.length) updateOutToken(val, outTokens[0]);
    });
  }

  const calculateDirectMessages = async () => {
    const values = $routeValues;
    const account = $foundAccountInfo;
    if (!account || !values) return;
    
    loading = true;
    const sourceAssetChainID = values.inToken.originalChain;
    chainIdsToAddresses[sourceAssetChainID] = $userAddress;
    chainIdsToAddresses[NEUTRON_ID] = account.address;  

    $skipClient.msgsDirect({
      ...SKIP_COMMON,
      destAssetChainID: NEUTRON_ID,
      destAssetDenom: values.outToken.denom,
      sourceAssetDenom: values.inToken.denom,
      amountIn: values.inParsed.toString(),
      slippageTolerancePercent: "8",
      chainIdsToAddresses,
      sourceAssetChainID,
      goFast,
    })
    .then(dirRes => setDirectResponse(values, dirRes, $userAddress, sourceAssetChainID))
    .then(vals => console.log('Direct messages calculated:', vals))
    .catch(e => console.error('Error calculating direct messages', e))
    .finally(() => loading = false);

  }


  const deposit = async () => {
    const values = $routeValues;
    const direct = $directRes;
    if (!values || !direct || direct.txs.length != 1) return;
    
    executeRoute($skipClient, direct.txs, direct.route, values, $cosmosClient)
    .then(() => modalStore.clear())
    .catch(e => console.error('Error withdrawing', e))
    .finally(() => loading = false);
  }


  const onClick = () => {
    if (!$directRes) {
      calculateDirectMessages()
    } else {
      deposit()
    }
  }


  const clickCancel = () => {
		modalStore.clear();
	};

  // reset all available tokens on chain change
  $: if ($selectedChain) updateChain($selectedChain)

    
  $: if ($inToken || $outToken || $inValue)  directRes.set(null);

</script>


<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 px-5 overflow-auto max-h-screen">

  <ElevatedBox styles="py-1 md:p-3 overflow-scroll"><h3 class="text-md font-bold ">Deposit</h3></ElevatedBox>

  { #if $inToken && $routeValues  }
      
    { @const { outUSD, outToken, outValue } = $routeValues }
    
    <div class="py-5 pb-3 md:px-3 flex flex-col justify-between gap-5">

        <InTokenInput disabled={loading}/>

        { #if outToken && outTokens.length }

          <div class="relative py-2">
            <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="recieve">Recieve</label>
            <div class="flex w-full justify-between items-stretch ">

              <div class="border-b border-grey-100 text-lg p-7 w-full flex gap-3">

                <span>
                  {outValue || "឴"}
                </span>

                { #if outUSD && outUSD != "0.00" }
                  <span class="absolute bottom-2 left-7 label text-xs text-gray-200 ">( ${outUSD} )</span>
                { /if }
                
              </div>

              <OutTokenButton disabled={loading} />

            </div>

          </div>

        { /if }

        
        { #if $routeValues?.routeSecs }
          <div class="w-full flex items-center justify-between font-bold px-1 sm:px-4">
            <div>Estimated Time</div>
            <div class="flex justify-between items-center gap-4 text-sm sm:text-base">
              <span>{formatSeconds($routeValues.routeSecs)}</span>
            </div>
          </div>
        { /if }


        <FeeAccordion />
        
        
        <div class="flex justify-end items-center px-2 my-3">

          <div class="flex gap-5">

            <ElevatedButtonBox selected onClick={clickCancel} small={false}>Cancel</ElevatedButtonBox>

            <ElevatedButtonBox styles="variant-filled-primary" 
              onClick={onClick} 
              disabled={loading || !outTokens.length || !outToken } small={false}
            >
              {#if $directRes }
                Deposit
              { :else if loading }
                <ProgressRadial value={undefined} width="w-6" />
              {:else}
                Calculate
              {/if}
            </ElevatedButtonBox>

          </div>
        </div>

    </div>

  { /if }
    
</GhostBox>
