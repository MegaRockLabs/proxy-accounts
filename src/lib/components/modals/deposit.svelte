<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  import InTokens from '../common/inTokens.svelte';
  import OutTokens from '../common/outTokens.svelte';

  import { selectedChain } from '$lib/chains';
  import { getModalStore, getToastStore, ProgressRadial } from "@skeletonlabs/skeleton";
  
  import type { Chain, CosmosToken, Token } from '$lib/types';
  
  import { BASESCAN, chainIdsToAddresses, NEUTRON_ID, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, getOutTokens } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, skipClient } from '$lib/clients';
  import { userAddress } from '$lib/accounts';
  import { directRes, executeRoute, setDirectResponse, viewTxAction } from '$lib/routes';
  
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';
  import { onMount } from 'svelte';
  import Calculated from '../common/calculated.svelte';
  import { formatError } from '$lib/utils';
  import { toastTransaction } from '$lib/toasts';
  import { deleteBridgeTask } from '$lib';
  import { updateAccountBalances } from '$lib/assets';

  export let parent: any = {} 
  if (parent) {}

	const modalStore = getModalStore();
  const toastStore = getToastStore();


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
    .then(vals => {
      console.log('Direct messages calculated:', vals)
      error = '';
    })
    .catch(e => {
      console.error('Error calculating direct messages', e)
      error = formatError(e);
      directRes.set(null)
    })
    .finally(() => loading = false);

  }

  let error: string = '';

  const deposit = async () => {
    const values = $routeValues;
    const direct = $directRes;
    const account = $foundAccountInfo;
    if (!values || !direct || !account || direct.txs.length != 1) return;

    loading = true;

    const exec = await executeRoute($skipClient, direct.txs, direct.route, values, $cosmosClient);
    console.log('Executing route:', exec);

    let promise = exec.promise;
    const txHash = exec.txHash;
    const expLink = BASESCAN + txHash;
    const action = viewTxAction(txHash, expLink);

    if (values.routeSecs > 50) {
      toastStore.trigger({
        message: "Broadcasted",
        autohide: false,
        action: viewTxAction(txHash, expLink, false)
      });
      promise = new Promise(r => r);
    } else {
      toastTransaction(
        toastStore, 
        "Depositing",  
        "Success", 
        promise,
        { action }
      );
    } 
    
    promise.then(depres => {
      console.log('Deposited res:', depres);
      error = '';
      deleteBridgeTask(txHash);
      modalStore.clear();
      updateAccountBalances($cosmosClient, account.address);
    })
    .catch(e => {
      console.error('Error depositing route', e);
      error = formatError(e);
    })
    .finally(() => {
      directRes.set(null)
      loading = false;
    })
  }


  const onClick = () => {
    if (!$directRes) {
      calculateDirectMessages()
    } else {
      deposit()
      .catch(e => {
        console.error('Error depositing', e);
        error = formatError(e);
        loading = false;
      });
    }
  }


  const clickCancel = () => {
		modalStore.clear();
	};

  onMount(() => directRes.set(null))

  // reset all available tokens on chain change
  $: if ($selectedChain) updateChain($selectedChain)
  $: if ($inToken || $outToken || $inValue || error)  directRes.set(null);
</script>


<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />



<GhostBox styles="w-full md:w-2/3 lg:w-1/2 px-5 overflow-auto max-h-screen">

  <ElevatedBox><h3 class="h3 font-bold">Deposit</h3></ElevatedBox>

  { #if $inToken && $routeValues  }
      
    { @const { outUSD, outToken, outValue } = $routeValues }
    
    <div class="py-5 pb-3 md:px-3 flex flex-col justify-between gap-5">

        <InTokenInput disabled={loading}/>

        { #if outToken && outTokens.length }

          <div class="relative ">
            <label class="absolute top-1 left-2 label text-xs text-gray-200 " for="recieve">Recieve</label>
            <div class="flex w-full justify-between items-stretch gap-3 " >
              
              <div class="border-b border-grey-100 text-lg py-5 px-1 sm:px-7 w-full flex gap-3 relative  sm:py-7">
                { #if outUSD && outUSD != "0.00" }
                  <span class="absolute bottom-1 left-3 sm:left-7 label text-xs text-gray-200 ">( ${outUSD} )</span>
                { /if }
                <span>
                  {outValue ? outValue.toFixed(4) : "឴"}
                </span>
              </div>

              <OutTokenButton disabled={loading} />
            </div>
          </div>

        { /if }


        <Calculated {error} />
        
        
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
