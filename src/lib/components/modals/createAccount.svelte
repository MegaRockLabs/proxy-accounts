<script lang="ts">
	import { fromHex, toBase64, toUtf8 } from '@cosmjs/encoding';
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';
  
  import { selectedChain } from '$lib/chains';
  import { getModalStore } from "@skeletonlabs/skeleton";
  
  import type { Coin } from '@cosmjs/stargate';
  import type { Credential, CredentialData } from 'smart-account-auth';
  import type { Chain, CosmosToken, Token } from '$lib/types';

  import { chainIdsToAddresses, NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, NTRN } from '$lib/tokens';
  
  import { createAccount, foundAccountInfo } from '$lib/accounts';
  import { cosmosClient, relayingClient, skipClient } from '$lib/clients';
  import { formatEther } from 'viem';
  import { userAddress } from '$lib/accounts';
  import { getWagmiConnector, relayingAddress, wagmiAdapter } from '$lib/signers';
  import { signMessage } from '@wagmi/core';
  import { accountCreationFees } from '$lib/registry';
  import { directRes, executeRoute, setDirectResponse, setRouteValues } from '$lib/routes';
  import InTokens from '../common/inTokens.svelte';
  import OutTokens from '../common/outTokens.svelte';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';

  export let parent: any = {} 
  if (parent) {}

  formatEther
	const modalStore = getModalStore();


  let loading = false;
  
  let inChain : Chain;
  let inTokens : Token[] = [];
  let outTokens : CosmosToken[] = [];

  // 0.00007381847388687

  const updateChain = async (chain: Chain) => {
    inChain = chain;
    inTokens = getInTokens(inChain);
    outTokens = [NTRN];
    
    updateInToken($routeValues ?? {}, inTokens[0])
    .then(val => {
      if (outTokens.length) updateOutToken(val, NTRN);
    });

  }


  const calculateDirectMessages = async () => {
    const values = $routeValues;
    if (!ethCredential) await clickAddEth();
    console.log('values', values);
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
    .then(dirRes => setDirectResponse(values, dirRes, $userAddress, sourceAssetChainID, undefined, feeCoin))
    .then(vals => console.log('Direct messages calculated:', vals))
    .catch(e => console.error('Error calculating direct messages', e))
    .finally(() => loading = false)
  }


  $: message = JSON.stringify({
    chain_id: NEUTRON_ID,
    contract_address: NEUTRON_REGISTRY,
    messages: ["Create Proxy Account"],
    nonce: "0"
  })

  let ethCredential : Credential;
  let credentials : Credential[]

  const clickAddEth = async () => {
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
    ethCredential = cred;
    console.log('eth cred', cred);
    credentials = [...(credentials ?? []).filter(c => !('eth_personal_sign' in c)), cred]

    clickCreate();
  }

  $: feeCoin = $accountCreationFees.find((fee : Coin) => fee.denom === NEUTRON_DENOM)!

  let createMsg : any;

  const clickCreate = async () => {
    const accountData : CredentialData = {
      credentials,
      with_caller: false
    };

    const msg = await createAccount(
      $relayingClient,
      $relayingAddress!,
      { denom: feeCoin!.denom, amount: feeCoin!.amount },
      accountData,
      true
    );
    createMsg = msg;
    console.log('create msg', msg);
  };  



  const createClick = async () => {
    const values = $routeValues;
    const direct = $directRes;
    if (!values || !direct || direct.txs.length != 1) return;
    if (!createMsg) await clickAddEth();
    
    executeRoute($skipClient, direct.txs, direct.route, values, $cosmosClient)
    .then(() => modalStore.clear())
    .catch(e => console.error('Error withdrawing', e))
    .finally(() => loading = false);

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

  <ElevatedBox styles="p-3"><h3 class="text-md font-bold">Transfer</h3></ElevatedBox>

   {#if $inToken && $routeValues  }

   { @const { outUSD, outToken, outValue } = $routeValues }


    <div class="pu-5 pb-3 px-3 flex flex-col justify-between gap-5">

      <InTokenInput disabled={loading} />

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

      {/if}
        
    </div>

  {/if}
  

  <div>
    <ElevatedButtonBox onClick={calculateDirectMessages} >
      Calculate Direct
    </ElevatedButtonBox>

    <ElevatedButtonBox onClick={createClick} >
      Create Account
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

      -->
    

  <div class="my-5 border-t border-white/20"></div>

  <div class="flex justify-between items-center px-2">
    <div class="flex gap-2">
      <ElevatedButtonBox selected onClick={clickCancel}>Cancel</ElevatedButtonBox>
      <ElevatedButtonBox onClick={calculateDirectMessages} >
        Deposit
      </ElevatedButtonBox>
    </div>
  </div>

  
</GhostBox>
