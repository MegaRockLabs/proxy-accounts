<script lang="ts">
	import { fromHex, toBase64, toUtf8 } from '@cosmjs/encoding';
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  
  import { selectedChain } from '$lib/chains';
  import { getModalStore, getToastStore, ProgressRadial } from "@skeletonlabs/skeleton";
  
  import type { Coin } from '@cosmjs/stargate';
  import type { CredentialData } from 'smart-account-auth';
  import type { Chain, CosmosToken, RouteValues, Token } from '$lib/types';

  import { BASESCAN, chainIdsToAddresses, NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, NTRN } from '$lib/tokens';
  
  import { userAddress } from '$lib/accounts';
  import { createAccountMsg } from '$lib/accounts';
  import { cosmosClient, relayingClient, skipClient } from '$lib/clients';
  import { getWagmiConnector, relayingAddress, wagmiAdapter, walletIcon } from '$lib/signers';
  import { signMessage } from '@wagmi/core';
  import { accountCreationFees } from '$lib/registry';
  import { directRes, executeRoute, setDirectResponse, viewTxAction } from '$lib/routes';
  import InTokens from '../common/inTokens.svelte';
  import OutTokens from '../common/outTokens.svelte';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import Calculated from '../common/calculated.svelte';
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';
  import { formatAddress, formatError } from '$lib/utils';
  import { deleteBridgeTask, onEthAddressFound } from '$lib';
  import { toastTransaction } from '$lib/toasts';
  import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

  export let parent: any = {} 
  if (parent) {}

	const modalStore = getModalStore();
  const toastStore = getToastStore();


  let loading = false;
  
  let inChain : Chain;
  let inTokens : Token[] = [];
  let outTokens : CosmosToken[] = [];
  let controlAddress : string;
  let error: string = '';


  const message = JSON.stringify({
    chain_id: NEUTRON_ID,
    contract_address: NEUTRON_REGISTRY,
    messages: ["Create Proxy Account"],
    nonce: "0"
  })


  let createMsg : any;

  $: feeCoin = $accountCreationFees.find((fee : Coin) => fee.denom === NEUTRON_DENOM)!

  const updateChain = async (chain: Chain) => {
    inChain = chain;
    outTokens = [NTRN];
    inTokens = getInTokens(inChain);
    updateInToken($routeValues ?? {}, inTokens[0])
    .then(val => {
     updateOutToken(val, NTRN);
    });
  }



  const calculateRoute = async () => {
    const values = $routeValues;
    if (!values) return;
    
    loading = true;
    const sourceAssetChainID = values.inToken.originalChain;
    chainIdsToAddresses[sourceAssetChainID] = $userAddress;
    chainIdsToAddresses[NEUTRON_ID] = NEUTRON_REGISTRY;  


    $skipClient.msgsDirect({
      ...SKIP_COMMON,
      destAssetChainID: NEUTRON_ID,
      destAssetDenom:  values.outToken.denom,
      sourceAssetDenom: values.inToken.denom,
      sourceAssetChainID: values.inToken.originalChain,
      amountIn: values.inParsed.toString(),
      slippageTolerancePercent: "5",
      chainIdsToAddresses,
      postRouteHandler: {
        wasmMsg: {
          contractAddress: NEUTRON_REGISTRY,
          msg: JSON.stringify(createMsg)
        }
      }
    })
    .then(async dirRes => {
      if (dirRes.txs.length != 1 || dirRes.msgs.length != 1) {
        throw new Error('Only atomic bridging txs are supported');
      }
      const vals = await setDirectResponse(values, dirRes, $userAddress, sourceAssetChainID, undefined, feeCoin)
      if (vals.outValue < 5) {
        throw new Error('Must recieve at least 5 NTRN to cover future fees');
      }
      
      await simulateCreation(vals);
      return vals;
    })
    .then(vals => {
      console.log('Create messages calculated:', vals)
      error = '';
    })
    .catch(e => {
      console.error('Error calculating creation messages', e)
      error = formatError(e);
      directRes.set(null)
    })
    .finally(() => loading = false);

  }


 
  const signCreateMsg = async () => {

    const wagmi = $wagmiAdapter;

    const connector = await getWagmiConnector(wagmi);
    const addresses = await connector.getAccounts();
    const account = addresses[0].toLowerCase() as `0x${string}`;

    const signature = await signMessage(wagmi.wagmiConfig, {
      message,
      account,
      connector
    })

    const sigBytes = fromHex(signature.slice(2));

    const cred = {
      eth_personal_sign: {
          signer: account,
          signature: toBase64(sigBytes),
          message: toBase64(toUtf8(message))
      }
    }

    const accountData : CredentialData = {
      credentials: [cred],
      with_caller: false
    };

    
    createMsg = createAccountMsg(
      $relayingAddress!,
      { denom: feeCoin!.denom, amount: feeCoin!.amount },
      accountData,
    );

    controlAddress = account;

    console.log('create msg', createMsg);
  }



  export const simulateCreation = async (values?: RouteValues) => {
    values ??= $routeValues;
    const fee = $accountCreationFees.find(fee => fee.denom === NEUTRON_DENOM);
    if (!values || !fee || !$directRes) return;

    // const finalAmount = values.outParsed - BigInt(fee.amount);

    const encoded = MsgExecuteContract.fromPartial({
        contract: NEUTRON_REGISTRY,
        msg: toUtf8(JSON.stringify(createMsg)),
        sender: $relayingAddress,
        funds: [{ denom: fee.denom, amount: fee.amount  }]
    })

    await $relayingClient.simulate(
      $relayingAddress, 
      [{ typeUrl: MsgExecuteContract.typeUrl, value: encoded }],
      ""
    )
  }


  const create = async () => {
    const values = $routeValues;
    const direct = $directRes;

    if (!direct || !values) return;

    if (!direct || direct.txs.length != 1) return;

    console.log('Creating account with values:', values);

    let { txHash, promise } = await executeRoute($skipClient, direct.txs, direct.route, values, $cosmosClient, true);
    const expLink = BASESCAN + txHash;
    const action = viewTxAction(txHash, expLink);

    if (values.routeSecs > 50) {
      toastStore.trigger({
        message: "Broadcasted",
        autohide: false,
        action: viewTxAction(txHash, expLink, false)
      });
      promise = new Promise((resolve) => resolve(null));
    } else {
      toastTransaction(
        toastStore, 
        "Creating Account",  
        "Success", 
        promise,
        { action },
        { action: viewTxAction(txHash, expLink, false),
          hideDismiss: true 
        }
      );
    };

    promise.then(accress => {
      console.log('Created res:', accress);
      error = '';
      deleteBridgeTask(txHash);
      modalStore.clear();
      onEthAddressFound($wagmiAdapter, $selectedChain.id, $cosmosClient, $userAddress)
    })
    .catch(e => {
      console.error('Error depositing route', e);
      error = formatError(e);
    })
    .finally(() => {
      directRes.set(null)
      loading = false;
    });
  }

  
  const onClick = async () => {

    error = '';
    loading = true;

    console.log('onClick', $inToken, $outToken, $inValue, $routeValues);

    try {
      if (!createMsg) {
          await signCreateMsg();
      } else if (!$directRes) {
        await calculateRoute();
      } else {
        console.log('Creating account');
        await create();
      }

    } catch (e) {
      console.error('Error creating account', e);
      formatError(e);

    } 

    loading = false;
    
  }


  const clickCancel = () => {
		modalStore.clear();
	};


  $: if ($selectedChain) updateChain($selectedChain)
  
  $: if ($inToken || $outToken || $inValue || error)  directRes.set(null);

</script>


<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />


<GhostBox styles="w-full md:w-2/3 lg:w-1/2 px-5 overflow-auto max-h-screen pt-3">

  <ElevatedBox><h3 class="h3 font-bold my-2">Create an Account (+Deposit)</h3></ElevatedBox>

  { #if $inToken && $routeValues  }
      
    { @const { outUSD, outValue } = $routeValues }
    
    <div class="py-7 pb-3 md:px-3 flex flex-col justify-between gap-5">

        <InTokenInput disabled={loading}/>

        { #if createMsg && controlAddress }
        
          <div class="border-b border-grey-100  relative py-2 mb-7 flex w-full justify-between items-center">

            <div class="absolute top-1 sm:top-2 left-2 text-xs ">Controlling with</div>
    
            <div id="to"
              class="pt-5 pb-2 px-2 sm:px-3 md:px-7 sm:pt-7 sm:pb-3 text-sm sm:text-md  "
            >
              {formatAddress(controlAddress, 10)}
            </div>

            {#if $walletIcon}
                <img src={$walletIcon} alt="wallet icon" class="w-8 h-8" />
            {/if}
          </div>
        { /if }

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

            <OutTokenButton disabled={true}  token={NTRN}/>
          </div>
        </div>
        

        <Calculated {error} creating={true} />
        
        <div class="flex justify-end items-center px-2 my-3">

          <div class="flex gap-5">

            <ElevatedButtonBox selected onClick={clickCancel} small={false}>Cancel</ElevatedButtonBox>

            <ElevatedButtonBox styles="variant-filled-primary" 
              onClick={onClick} 
              disabled={loading} small={false}
            >

              { #if loading }
                <ProgressRadial value={undefined} width="w-6" />
              { :else if $directRes }
                Create
              { :else if !createMsg }
                Sign Proof
              {:else}
                Calculate Route
              {/if}
            </ElevatedButtonBox>

          </div>
        </div>

    </div>

  { /if }
    
</GhostBox>

 