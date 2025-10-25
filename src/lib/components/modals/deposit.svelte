<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  import InTokens from '../common/inTokens.svelte';
  import OutTokens from '../common/outTokens.svelte';

  import { selectedChain } from '$lib/chains';
  import { Progress } from "@skeletonlabs/skeleton-svelte";
  
  import type { Chain, CosmosToken, Token, RouteValues } from '$lib/types';
  import type { MsgsDirectResponse } from '@skip-go/client';
  
  import { BASESCAN, chainIdsToAddresses, NEUTRON_ID, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, getOutTokens } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, skipClient } from '$lib/clients';
  import { userAddress } from '$lib/accounts';
  import { directRes, executeRouteOwn, setDirectResponse, viewTxAction } from '$lib/routes';
  
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';
  import { onMount } from 'svelte';
  import Calculated from '../common/calculated.svelte';
  import { formatError } from '$lib/utils';
  import { toastTransaction } from '$lib/toasts';
  import { deleteBridgeTask } from '$lib';
  import { updateAccountBalances } from '$lib/assets';
  import { createToaster } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    parent?: any;
    onClose?: () => void;
  }

  let { parent = {}, onClose }: Props = $props();
  if (parent) {}

  const toaster = createToaster({
    placement: 'top-end',
  });


  let loading = $state(false);
  
  let inChain : Chain;
  let inTokens : Token[] = $state([]);
  let outTokens : CosmosToken[] = $state([]);
  let lastUpdatedTokenDenom = $state('');
  
  let error: string = $state('');



  const updateChain = async (chain: Chain) => {
    inChain = chain;
    inTokens = getInTokens(inChain);
    outTokens = getOutTokens(inChain);
    
    const firstToken = inTokens[0];
    if (!firstToken) {
      console.warn('No input tokens available');
      return;
    }
    
    // Prevent updating with the same token repeatedly
    if (firstToken.denom === lastUpdatedTokenDenom) {
      console.log('Token already updated, skipping');
      return;
    }
    
    const values = $routeValues;
    if (!values) {
      console.warn('No route values available');
      return;
    }
    
    lastUpdatedTokenDenom = firstToken.denom;
    updateInToken(values, firstToken)
    .then(val => {
      if (outTokens.length) updateOutToken(val, outTokens[0]);
    })
    .catch(err => {
      console.error('Error updating token:', err);
      lastUpdatedTokenDenom = ''; // Reset on error to allow retry
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
    })
    .then((dirRes: MsgsDirectResponse) => setDirectResponse(values, dirRes, $userAddress, sourceAssetChainID))
    .then((vals: RouteValues) => {
      console.log('Direct messages calculated:', vals)
      error = '';
    })
    .catch((e: Error) => {
      console.error('Error calculating direct messages', e)
      error = formatError(e);
      directRes.set(null)
    })
    .finally(() => loading = false);

  }


  const deposit = async () => {
    const values = $routeValues;
    const direct = $directRes;
    const account = $foundAccountInfo;
    if (!values || !direct || !account || !direct.txs || direct.txs.length != 1 || !direct.route) return;

    loading = true;

    const exec = await executeRouteOwn(direct.txs, direct.route, values, $cosmosClient);
    console.log('Executing route:', exec);

    let promise = exec.promise;
    const txHash = exec.txHash;
    const expLink = BASESCAN + txHash;
    const action = viewTxAction(txHash, expLink);

    if (values.routeSecs > 50) {
      toaster.info({
        title: "Deposit Broadcasted",
        description: txHash,
        // action: viewTxAction(txHash, expLink, false)
      });
      promise = new Promise((resolve) => resolve(null));
    } else {
      toastTransaction(
        toaster, 
        "Depositing",  
        "Success", 
        promise,
        { action },
        { action: viewTxAction(txHash, expLink, false),
          hideDismiss: true 
        }
      );
    } 
    
    promise.then((depres) => {
      console.log('Deposited res:', depres);
      error = '';
      deleteBridgeTask(txHash);
      if (onClose) onClose();
      updateAccountBalances($cosmosClient, account.address);
    })
    .catch((e) => {
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
		if (onClose) onClose();
	};

  onMount(() => directRes.set(null))

  // Track previous chain to prevent unnecessary updates
  let prevChainId = $state('');
  let isUpdatingChain = $state(false);
  
  $effect(() => {
    const chain = $selectedChain;
    if (chain && chain.id !== prevChainId && !isUpdatingChain) {
      prevChainId = chain.id;
      isUpdatingChain = true;
      updateChain(chain).finally(() => {
        isUpdatingChain = false;
      });
    }
  });
  
  // Track previous values to prevent unnecessary resets
  let prevInTokenDenom = $state('');
  let prevOutTokenDenom = $state('');
  let prevInValue = $state(0);
  let prevError = $state('');
  
  $effect(() => {
    const inTokenDenom = $inToken?.denom || '';
    const outTokenDenom = $outToken?.denom || '';
    const inVal = $inValue || 0;
    const err = error || '';
    
    if (inTokenDenom !== prevInTokenDenom || 
        outTokenDenom !== prevOutTokenDenom || 
        inVal !== prevInValue ||
        err !== prevError) {
      prevInTokenDenom = inTokenDenom;
      prevOutTokenDenom = outTokenDenom;
      prevInValue = inVal;
      prevError = err;
      
      directRes.set(null);
    }
  });
</script>


<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />



<GhostBox styles="w-full md:w-2/3 lg:w-1/2 px-5 overflow-auto max-h-screen pt-3">

  <ElevatedBox><h3 class="h3 font-bold">Deposit</h3></ElevatedBox>

  {#if $inToken && $routeValues}
      
    {@const { outUSD, outToken, outValue } = $routeValues}
    
    <div class="py-5 pb-3 md:px-3 flex flex-col justify-between gap-5">

        <InTokenInput disabled={loading} tokens={inTokens} />

        {#if outToken && outTokens.length}

          <div class="relative ">
            <label class="absolute top-1 left-2 label text-xs text-gray-200 " for="recieve">Recieve</label>
            <div class="flex w-full justify-between items-stretch gap-3 " >
              
              <div class="border-b border-grey-100 text-lg py-5 px-1 sm:px-7 w-full flex gap-3 relative  sm:py-7">
                {#if outUSD && outUSD != "0.00"}
                  <span class="absolute bottom-1 left-3 sm:left-7 label text-xs text-gray-200 ">( ${outUSD} )</span>
                { /if }
                <span>
                  {outValue ? outValue.toFixed(4) : "឴"}
                </span>
              </div>

              <OutTokenButton disabled={loading} tokens={outTokens} />
            </div>
          </div>

        { /if }


        <Calculated {error} />
        
        
        <div class="flex justify-end items-center px-2 my-3">

          <div class="flex gap-5">

            <ElevatedButtonBox selected onClick={clickCancel} small={false}>Cancel</ElevatedButtonBox>

            <ElevatedButtonBox styles="preset-filled-primary-500" 
              onClick={onClick} 
              disabled={loading || !outTokens.length || !outToken } small={false}
            >
              {#if $directRes}
                Deposit
              {:else if loading}
                <Progress value={undefined} class="w-6" />
              {:else}
                Calculate
              {/if}
            </ElevatedButtonBox>

          </div>
        </div>

    </div>

  { /if }
    
</GhostBox>
