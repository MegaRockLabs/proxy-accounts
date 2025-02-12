<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  import OutTokens from '../common/outTokens.svelte';
  import InTokens from '../common/inTokens.svelte';

  import { selectedChain } from '$lib/chains';
  import { getModalStore, ProgressRadial } from "@skeletonlabs/skeleton";
  
  import type { MsgsDirectRequest, MsgsDirectResponse, Tx } from '@skip-go/client';
  import type { Chain, CosmosToken, Token } from '$lib/types';
  import { chainIdsToAddresses, NEUTRON_ID, SKIP_COMMON } from '$lib/vars';
  import { NeutronTokenMap, BASE_WETH, BASE_USDC, BASE_AXL_USDC, BASE_ETH } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, relayingClient, skipClient } from '$lib/clients';
  import { accountBalances } from '$lib/assets';
  
  import { 
    inToken, outToken, routeValues, 
    updateInToken, updateOutToken
  } from '$lib/values';

  import { calculateCosmosTxs, directRes, executeRoute, setDirectResponse, setRouteValues } from '$lib/routes';
  import { relayingAddress } from '$lib/signers';
  import { userAddress } from '$lib/accounts';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import Separator from '../common/separator.svelte';
  import { formatSeconds } from '$lib/utils';
  import FeeAccordion from '../common/feeAccordion.svelte';
  
  export let parent: any = {} 
  if (parent) {}

  const modalStore = getModalStore();


  let outAddress = $userAddress
  let inTokens : CosmosToken[] = [];
  let outTokens : Token[] = [];

  let goFast : boolean = true;
  let loading = false;


  const updateToAddress = (address: string) => {
    console.log('updateToAddress', address);
    outAddress = address;

    if (outAddress.startsWith('0x') && outAddress.length == 42) {
      const tokens = [BASE_WETH, BASE_ETH, BASE_USDC, BASE_AXL_USDC];
      if (outTokens.length != tokens.length) {
        outTokens = tokens;
        console.log('updateToAddress eth', outTokens);
        updateOutToken($routeValues ?? {}, BASE_WETH);
      }
    } else if (outAddress.startsWith('neutron1') ) {
      const tokens = Object.values(NeutronTokenMap)
      if (outTokens.length != tokens.length) {
        outTokens = tokens;
        console.log('updateToAddress ntrn', outTokens);
        updateOutToken($routeValues ?? {}, outTokens[0]);
      }
    } else {
      outTokens = [];
    }
  }

  const updateChain = async (_chain: Chain) => {
    inTokens = $accountBalances.map((token) => token.token);

    updateInToken($routeValues ?? {}, inTokens[0])
    .then(val => {
      if (outTokens.length) updateOutToken(val, outTokens[0]);
    });
  }


  const withdraw = async () => {
    const account = $foundAccountInfo;
    const values = $routeValues;
    const direct = $directRes;
    if (!account || !values || !direct || direct.txs.length != 1) return;

    executeRoute($skipClient, direct.txs, direct.route, values, $cosmosClient)
    .then(() => modalStore.clear())
    .catch(e => console.error('Error withdrawing', e))
    .finally(() => loading = false);
  }

  const calculateDirectMessages = async () => {
    const values = $routeValues;

    let destAssetChainID = values.outToken.originalChain; 
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

    const dirReq: MsgsDirectRequest = {
      ...SKIP_COMMON,
      destAssetChainID,
      destAssetDenom: values.outToken.denom,
      sourceAssetDenom: values.inToken.denom,
      sourceAssetChainID: NEUTRON_ID,
      amountIn: values.inParsed.toString(),
      slippageTolerancePercent: "10",
      goFast,
      chainIdsToAddresses
    }

    const relayer = $relayingClient;

    $skipClient.msgsDirect(dirReq)
    .then(direct => calculateCosmosTxs(relayer, $relayingAddress, direct, account, true) as Promise<MsgsDirectResponse>)
    .then(direct => setDirectResponse(values, direct, $userAddress, NEUTRON_ID, relayer))
    .then(vals => console.log('Direct messages calculated:', vals))
    .catch(e => console.error('Error calculating direct messages', e))
    .finally(() => loading = false);
  }

  const onClick = () => {
    if (!$directRes) {
      calculateDirectMessages()
    } else {
      withdraw()
    }
  }

  const clickCancel = () => {
		modalStore.clear();
	};


  
  $: if ($selectedChain) updateChain($selectedChain)

  $: if ($userAddress) outAddress = $userAddress;

  $: if (outAddress) updateToAddress(outAddress)
    
  $: if ($inToken || $outToken || outAddress)  directRes.set(null);

  $: console.log('routeValues', $routeValues);

</script>

<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 md:px-5 overflow-auto max-h-screen">

  <ElevatedBox><h3 class="h3 font-bold">Withdraw</h3></ElevatedBox>

  { #if $inToken && $routeValues  }
      
    { @const { outUSD, outToken, outValue } = $routeValues }
      
    <div class="pt-5 pb-3 flex flex-col justify-between gap-5 px-0">

      <InTokenInput disabled={loading} />

      <div class="border border-grey-100 rounded-container-token relative  {outTokens.length ? "": "input-error"}">
        <label class="absolute top-2 left-2 text-xs " for="to">Recipient</label>

        <input id="to" type="text" bind:value={outAddress}
          class="p-3 md:px-3 md:py-7 flex w-full bg-transparent border-none text-md  ">
      </div>

      { #if outToken && outTokens.length > 0 }
    
        <div class="relative">
          <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="to">To</label>
          
          { #if outUSD && outUSD != "0.00" }
              <span class="absolute bottom-2 left-7 label text-xs text-gray-200 ">( ${outUSD} )</span>
          {/if}

          
          <div class="flex w-full justify-between items-stretch">
            <div class="border-b border-grey-100  text-lg p-7 w-full flex gap-3">
              <span class="min-w-28 h-full">
                {outValue || "឴"}
              </span>
            </div>

            <OutTokenButton disabled={loading} />
          </div>
        </div>
        
      {/if}

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

          <ElevatedButtonBox styles="variant-filled-primary" onClick={onClick} disabled={loading || !outTokens.length || !outToken } small={false}>
            {#if $directRes }
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

    <Separator size={1} />
    

  { /if }

    
</GhostBox>
