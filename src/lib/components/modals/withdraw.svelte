<script lang="ts">
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  import OutTokens from '../common/outTokens.svelte';
  import InTokens from '../common/inTokens.svelte';

  import { selectedChain } from '$lib/chains';
  import { Progress } from "@skeletonlabs/skeleton-svelte";
  
  import { messagesDirect, type MsgsDirectRequest, type MsgsDirectResponse, type TxStatusResponse,  } from '@skip-go/client';
  import type { Chain, Token } from '$lib/types';
  import { chainIdsToAddresses, NEUTRON_ID, SKIP_COMMON } from '$lib/vars';
  import { NeutronTokenMap, BASE_WETH, BASE_USDC, BASE_AXL_USDC, BASE_ETH } from '$lib/tokens';
  
  import { foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, relayingClient } from '$lib/clients';
  import { accountBalances, updateAccountBalances } from '$lib/assets';
  
  import { 
    inToken, inValue, outToken, routeValues, 
    updateInToken, updateOutToken
  } from '$lib/values';

  import { calculateCosmosTxs, directRes, executeRouteCosmwasm, setDirectResponse, viewTxAction } from '$lib/routes';
  import { relayingAddress } from '$lib/signers';
  import { userAddress } from '$lib/accounts';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import Separator from '../common/separator.svelte';
  import { formatError } from '$lib/utils';
  import Calculated from '../common/calculated.svelte';
  import { toastTransaction } from '$lib/toasts';
  import { activeFeeGrants } from '$lib/cosmos';
  import { deleteBridgeTask } from '$lib';
  
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


  let outAddress = $state($userAddress)
  let inTokens : Token[] = $state([]);
  let outTokens : Token[] = $state([]);
  let lastUpdatedTokenDenom = $state('');
  let lastAddressType = $state(''); // Track address type to prevent redundant updates

  let goFast : boolean = true;
  let loading = $state(false);

  let error: string = $state('');



  const updateToAddress = (address: string) => {
    directRes.set(null);

    if (address.startsWith('0x') && address.length == 42) {
      if (lastAddressType === 'eth') return; // Prevent redundant updates
      lastAddressType = 'eth';
      const tokens = [BASE_WETH, BASE_ETH, BASE_USDC, BASE_AXL_USDC];
      outTokens = tokens;
      updateOutToken($routeValues ?? {}, BASE_WETH);
    } else if (address.startsWith('neutron1') ) {
      if (lastAddressType === 'neutron') return; // Prevent redundant updates
      lastAddressType = 'neutron';
      const tokens = Object.values(NeutronTokenMap)
      outTokens = tokens;
      updateOutToken($routeValues ?? {}, outTokens[0]);
    } else {
      lastAddressType = 'invalid';
      error = 'Only Eth (0x...) and Neutron (neutron1...) addresses are supported';
      outTokens = [];
    }
  }

  const updateChain = async (_chain: Chain) => {
    console.log('Updating chain for withdraw:', _chain);
    console.log('Account balances:', $accountBalances);
    console.log('routeValues:', $routeValues);

    const balances = $accountBalances;
    if (!balances || balances.length === 0) {
      console.warn('No account balances available');
      inTokens = [];
      return;
    }

    inTokens = balances.map((b) => b.token);

    const first = inTokens[0];
    if (!first) {
      console.warn('No valid input token found');
      return;
    }
    
    // Prevent updating with the same token repeatedly
    if (first.denom === lastUpdatedTokenDenom) {
      console.log('Token already updated, skipping');
      return;
    }
    
    const values = $routeValues;
    if (!values) {
      console.warn('No route values available');
      return;
    }
    
    lastUpdatedTokenDenom = first.denom;
    updateInToken(values, first)
    .then(val => {
      if (outTokens.length) updateOutToken(val, outTokens[0]);
    })
    .catch(err => {
      console.error('Error updating token:', err);
      lastUpdatedTokenDenom = ''; // Reset on error to allow retry
    });
  }


  const withdraw = async () => {

    const account = $foundAccountInfo;
    const values = $routeValues;
    const direct = $directRes;
    if (!account || !values || !direct || !direct.txs || direct.txs.length != 1) return;

    loading = true;

    const execute = await executeRouteCosmwasm(
      $relayingClient, $relayingAddress,
      direct.txs, account, 
      $activeFeeGrants, values
    );

    let promise : Promise<TxStatusResponse | null> = execute.promise;
    const txHash = execute.txHash;
    const action = viewTxAction(txHash);

    if (values.routeSecs > 45) {
      toaster.info({
        title: "Broadcasted",
        description: txHash,
      });
      // instantly resolving promise with empty value
      promise = new Promise((resolve) => resolve(null));
    } else {
      toastTransaction(
        toaster, 
        "Withdrawing",  
        "Success", 
        promise,
        { action },
        { action: viewTxAction(txHash, undefined, false),
          hideDismiss: true 
        }
      );
    }

    promise.then((res) => {
      console.log('Withdraw res', res)
      error = '';
      deleteBridgeTask(txHash);
      updateAccountBalances($cosmosClient, account.address);
      if (onClose) onClose();
    })
    .catch((e) => {
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
      destAssetChainId: destAssetChainID,
      destAssetDenom: values.outToken.denom,
      sourceAssetDenom: values.inToken.denom,
      sourceAssetChainId: NEUTRON_ID,
      amountIn: values.inParsed.toString(),
      slippageTolerancePercent: "10",
      goFast,
      chainIdsToAddresses
    }

    const relayer = $relayingClient;

    messagesDirect(dirReq)
    .then((direct: any) => calculateCosmosTxs(relayer, $relayingAddress, direct, account, true) as Promise<MsgsDirectResponse>)
    .then((direct: any) => setDirectResponse(values, direct, $userAddress, NEUTRON_ID, relayer))
    .then((vals: any) => {
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

  const onClick = () => {
    error = '';

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
		if (onClose) onClose();
	};

  // Track previous chain to prevent unnecessary updates
  let prevChainId = $state('');
  let isUpdatingChain = $state(false);
  let hasInitializedAddress = $state(false);
  
  $effect(() => {
    console.log('[Withdraw] Chain effect triggered');
    const chain = $selectedChain;
    if (chain && chain.id !== prevChainId && !isUpdatingChain) {
      console.log('[Withdraw] Chain changed:', chain.id, 'from:', prevChainId);
      prevChainId = chain.id;
      isUpdatingChain = true;
      updateChain(chain).finally(() => {
        console.log('[Withdraw] Chain update complete');
        isUpdatingChain = false;
      });
    }
  });

  // Only sync userAddress to outAddress on initial load, not continuously
  $effect(() => {
    const address = $userAddress;
    if (address && !hasInitializedAddress) {
      hasInitializedAddress = true;
      outAddress = address;
    }
  });

  // Track previous outAddress to prevent unnecessary updates
  let prevOutAddress = $state('');
  
  $effect(() => {
    console.log('[Withdraw] OutAddress effect triggered');
    if (outAddress && outAddress !== prevOutAddress) {
      console.log('[Withdraw] OutAddress changed:', outAddress, 'from:', prevOutAddress);
      prevOutAddress = outAddress;
      updateToAddress(outAddress);
    }
  });
  
  // Track previous values to prevent unnecessary resets
  let prevInTokenDenom = $state('');
  let prevOutTokenDenom = $state('');
  let prevInValue = $state(0);
    
  $effect(() => {
    // Reset error and directRes when input values change
    console.log('[Withdraw] Token/Value effect triggered');
    const inTokenDenom = $inToken?.denom || '';
    const outTokenDenom = $outToken?.denom || '';
    const inVal = $inValue || 0;
    
    if (inTokenDenom !== prevInTokenDenom || 
        outTokenDenom !== prevOutTokenDenom || 
        inVal !== prevInValue) {
      console.log('[Withdraw] Values changed - inToken:', inTokenDenom, 'outToken:', outTokenDenom, 'value:', inVal);
      prevInTokenDenom = inTokenDenom;
      prevOutTokenDenom = outTokenDenom;
      prevInValue = inVal;
      
      error = '';
      directRes.set(null);
    }
  });

</script>

<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 md:px-5 overflow-auto max-h-screen">

  <ElevatedBox><h3 class="h3 font-bold">Withdraw</h3></ElevatedBox>

  {#if $inToken && $routeValues}
      
    {@const { outUSD, outToken, outValue } = $routeValues}
      
    <div class="pt-5 pb-3 flex flex-col justify-between gap-5 px-0">

      <InTokenInput disabled={loading} tokens={inTokens} />

      <div class="border border-grey-100 rounded-container relative">
        <label class="absolute top-1 sm:top-2 left-2 text-xs " for="to">To</label>

        <input id="to" type="text" bind:value={outAddress} placeholder="0x... (base)  or  neutron1..."
          class="pt-5 pb-2 px-2 sm:px-3 md:px-7 sm:pt-7 sm:pb-3 flex w-full bg-transparent border-none text-xs sm:text-md "
        >
      </div>

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

      <Calculated {error}/>

      <div class="flex justify-end items-center px-2 my-3">

        <div class="flex gap-5">


          <ElevatedButtonBox selected onClick={clickCancel} small={false}>Cancel</ElevatedButtonBox>

          <ElevatedButtonBox styles="preset-filled-primary-500" onClick={onClick} disabled={loading || !outToken } small={false}>
            {#if $directRes && !error}
              Withdraw
            {:else if loading}
              <Progress value={undefined} class="w-6" />
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
