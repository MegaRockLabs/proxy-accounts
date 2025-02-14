<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  import OutTokens from '../common/outTokens.svelte';
  import InTokens from '../common/inTokens.svelte';

  import { selectedChain } from '$lib/chains';
  import { getModalStore, getToastStore, ProgressRadial, type ToastSettings } from "@skeletonlabs/skeleton";
  
  import type { MsgsDirectRequest, MsgsDirectResponse, Tx } from '@skip-go/client';
  import type { Chain, CosmosToken, Token } from '$lib/types';
  import { chainIdsToAddresses, MINTSCAN, NEUTRON_DENOM, NEUTRON_ID, SKIP_COMMON } from '$lib/vars';
  import { NeutronTokenMap, BASE_WETH, BASE_USDC, BASE_AXL_USDC, BASE_ETH } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, relayingClient, skipClient } from '$lib/clients';
  import { accountBalances, updateAccountBalances } from '$lib/assets';
  
  import { 
    inToken, inValue, outToken, routeValues, 
    updateInToken, updateOutToken
  } from '$lib/values';

  import { calculateCosmosTxs, directRes, executeRoute, executeRouteCosmwasm, setDirectResponse, setRouteValues, viewTxAction } from '$lib/routes';
  import { relayingAddress } from '$lib/signers';
  import { userAddress } from '$lib/accounts';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import Separator from '../common/separator.svelte';
  import { formatError } from '$lib/utils';
  import Calculated from '../common/calculated.svelte';
  import { toastTransaction } from '$lib/toasts';
  import { activeFeeGrants } from '$lib/cosmos';
  import { bridgeTasks, deleteBridgeTask } from '$lib';
  
  export let parent: any = {} 
  if (parent) {}

  const toastStore = getToastStore();
  const modalStore = getModalStore();


  let outAddress = $userAddress
  let inTokens : Token[] = [];
  let outTokens : Token[] = [];

  let goFast : boolean = true;
  let loading = false;

  let error: string = '';



  const updateToAddress = (address: string) => {
    console.log('updateToAddress', address);
    directRes.set(null);
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
      error = 'Only Eth (0x...) and Neutron (neutron1...) addresses are supported';
      outTokens = [];
    }
  }

  const updateChain = async (_chain: Chain) => {
    inTokens = $accountBalances.map((b) => b.token)

    const first = inTokens[0];
  /*   let first = inTokens.find(t => t.denom != NEUTRON_DENOM);
    if (!first) {
    }
 */
    updateInToken($routeValues ?? {}, first)
    .then(val => {
      if (outTokens.length) updateOutToken(val, outTokens[0]);
    });
  }


  const withdraw = async () => {
    const account = $foundAccountInfo;
    const values = $routeValues;
    const direct = $directRes;
    if (!account || !values || !direct || direct.txs.length != 1) return;

    loading = true;

    const execute = await executeRouteCosmwasm(
      $relayingClient, $relayingAddress,
      $skipClient, direct.txs, account, 
      $activeFeeGrants, values
    );

    let promise = execute.promise;
    const txHash = execute.txHash;
    const action = viewTxAction(txHash);

    if (values.routeSecs > 50) {
      toastStore.trigger({
        message: "Broadcasted",
        autohide: false,
        action: viewTxAction(txHash, undefined, false)
      });
      promise = new Promise(r => r);
    } else {
      toastTransaction(
        toastStore, 
        "Withdrawing",  
        "Success", 
        promise,
        { action }
      );
    }

    promise.then(ex => {
      console.log('Withdrawn', ex)
      error = '';
      deleteBridgeTask(txHash);
      updateAccountBalances($cosmosClient, account.address);
      modalStore.clear();
    })
    .catch(e => {
      console.error('Error executing route', e)
      error = e.message ?? e.toString();
    })
    .finally(() => {
      directRes.set(null)
      loading = false;
    });
  }

  const calculateDirectMessages = async () => {
    const values = $routeValues;

    let destAssetChainID = values.outToken.originalChain; 

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

  const onClick = () => {
    if (!$directRes || error) {
      calculateDirectMessages()
    } else {
      withdraw()
      .catch(e => {
        console.error('Error withdrawing', e)
        error = e.message ?? e.toString();
        loading = false;
      });
    }
  }

  const clickCancel = () => {
		modalStore.clear();
	};

  
  $: if ($selectedChain) updateChain($selectedChain)

  $: if ($userAddress) outAddress = $userAddress;

  $: if (outAddress) updateToAddress(outAddress)
    
  $: if ($inToken || $outToken  || $inValue)  {
    error = '';
    directRes.set(null);
  }

</script>

<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 md:px-5 overflow-auto max-h-screen">

  <ElevatedBox><h3 class="h3 font-bold">Withdraw</h3></ElevatedBox>

  { #if $inToken && $routeValues  }
      
    { @const { outUSD, outToken, outValue } = $routeValues }
      
    <div class="pt-5 pb-3 flex flex-col justify-between gap-5 px-0">

      <InTokenInput disabled={loading} />

      <div class="border border-grey-100 rounded-container-token relative">
        <label class="absolute top-1 sm:top-2 left-2 text-xs " for="to">To</label>

        <input id="to" type="text" bind:value={outAddress}
          class="pt-5 pb-2 px-2 sm:px-3 md:px-7 sm:pt-7 sm:pb-3 flex w-full bg-transparent border-none text-xs sm:text-md "
        >
       <!--  py-5 px-3 sm:p-7 -->
      </div>

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

      <Calculated {error}/>

      <div class="flex justify-end items-center px-2 my-3">

        <div class="flex gap-5">


          <ElevatedButtonBox selected onClick={clickCancel} small={false}>Cancel</ElevatedButtonBox>

          <ElevatedButtonBox styles="variant-filled-primary" onClick={onClick} disabled={loading || !outToken } small={false}>
            {#if $directRes && !error }
              Withdraw
            { :else if loading }
              <ProgressRadial value={undefined} width="w-6" />
            {:else}
              Authorize
            {/if}
          </ElevatedButtonBox>
        </div>
      </div>

    </div>

    <Separator size={1} />
    

  { /if }

    
</GhostBox>
