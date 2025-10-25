

<script lang="ts">
	import { fromHex, toBase64, toUtf8 } from '@cosmjs/encoding';
	import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
	import GhostBox from '$lib/components/common/ghostBox.svelte';

  import * as popover from "@zag-js/popover";
  import * as toast from "@zag-js/toast";
  import { normalizeProps, portal, useMachine } from "@zag-js/svelte";
  import { derived } from 'svelte/store';

  import { messagesDirect } from '@skip-go/client';
  
  import { selectedChain } from '$lib/chains';
  import type { Coin } from '@cosmjs/stargate';
  import type { CredentialData } from 'smart-account-auth';
  import type { Chain, CosmosToken, RouteValues, Token } from '$lib/types';
  import { 
    getPasskeyCredential,
    registerPasskey,
    loadPasskeyById,
    type PasskeyInfo,
    urlToBase64,
  } from 'smart-account-auth';

  import { BASESCAN, chainIdsToAddresses, NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, NTRN } from '$lib/tokens';
  
  import { userAddress } from '$lib/accounts';
  import { createAccountMsg } from '$lib/accounts';
  import { cosmosClient, relayingClient, skipClient } from '$lib/clients';
  import { getWagmiConnector, relayingAddress, wagmiAdapter, walletIcon } from '$lib/signers';
  import { signMessage } from '@wagmi/core';
  import { accountCreationFees } from '$lib/registry';
  import { directRes, executeRouteOwn, setDirectResponse, viewTxAction } from '$lib/routes';
  import InTokens from '../common/inTokens.svelte';
  import OutTokens from '../common/outTokens.svelte';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import Calculated from '../common/calculated.svelte';
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';
  import { formatAddress, formatError } from '$lib/utils';
  import { deleteBridgeTask, onEthAddressFound } from '$lib';
  // Removed toastTransaction import as it's outdated; replaced with Zag toast logic

  import { Progress } from "@skeletonlabs/skeleton-svelte"; // Assumed updated; use Progress for linear in latest
  import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';

  let { parent = {}, closeModal = () => {} } = $props(); 
  if (parent) {}

  // Zag Toast setup (place <ToastGroup> in root layout for rendering; here we handle creation)
  const toaster = toast.createStore({ placement: 'bottom-end', overlap: true, max: 5, removeDelay: 500 });

  popover.machine
  // Zag Popover setup for the "Register New" popup
  const popoverService = useMachine(popover.machine, () => ({

  }));
  const popoverApi = $derived(popover.connect(popoverService, normalizeProps));


  async function simulateCreation(values?: RouteValues) {
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

  let loading = $state(false);
  
  let inChain = $state<Chain>();
  let inTokens = $state<Token[]>([]);
  let outTokens = $state<CosmosToken[]>([]);
  let controlAddress = $state<string>();
  let error = $state<string>('');

  let credentials = $state<any[]>([]); 
  let registered = $state<PasskeyInfo | undefined>(undefined);

  
  let createMsg = $state<any>();


  const message = JSON.stringify({
    chain_id: NEUTRON_ID,
    contract_address: NEUTRON_REGISTRY,
    messages: ["Create Proxy Account"],
    nonce: "0"
  })

  const feeCoin = derived(accountCreationFees, ($accountCreationFees) => $accountCreationFees.find((fee : Coin) => fee.denom === NEUTRON_DENOM)!);

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

    messagesDirect({
      ...SKIP_COMMON,
      destAssetChainId: NEUTRON_ID,
      destAssetDenom:  values.outToken.denom,
      sourceAssetDenom: values.inToken.denom,
      sourceAssetChainId: values.inToken.originalChain,
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
      if (dirRes?.txs?.length != 1 || dirRes?.msgs?.length != 1) {
        throw new Error('Only atomic bridging txs are supported');
      }
      const vals = await setDirectResponse(values, dirRes, $userAddress, sourceAssetChainID, undefined, $feeCoin)
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

    const ethCred = {
      eth_personal_sign: {
          signer: account,
          signature: toBase64(sigBytes),
          message: toBase64(toUtf8(message))
      }
    }

    // Start with the mandatory Ethereum credential
    credentials = [ethCred];

    const accountData : CredentialData = {
      credentials,
      with_caller: false
    };

    
    createMsg = createAccountMsg(
      $relayingAddress!,
      { denom: $feeCoin!.denom, amount: $feeCoin!.amount },
      accountData,
    );

    controlAddress = account;

    console.log('create msg', createMsg);
  }



  const create = async () => {
    const values = $routeValues;
    const direct = $directRes!;

    if (!direct || !values) return;

    if (!direct || direct?.txs?.length != 1) return;

    console.log('Creating account with values:', values);

    try {
      let { txHash, promise } = await executeRouteOwn(direct.txs, direct.route!, values, $cosmosClient, true);
      const expLink = BASESCAN + txHash;
      const action = viewTxAction(txHash, expLink);

      if (values.routeSecs > 50) {
        toaster.create({
          title: "Broadcasted",
          duration: Infinity,
          action: {
            label: "View",
            onClick: () => window.open(expLink)
          }
        });
        promise = new Promise((resolve) => resolve(null));
      } else {
        // Replaced toastTransaction with toaster.promise
        toaster.promise(promise, {
          loading: { title: "Creating Account" },
          success: { title: "Success", action: { label: "View", onClick: () => window.open(expLink, '_blank') } },
          error: { title: "Error" }
        });
      };

      promise.then(accress => {
        console.log('Created res:', accress);
        error = '';
        deleteBridgeTask(txHash);
        closeModal(); // Replaced modalStore.clear()
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

    } catch (e) {
      console.error('Error creating account', e);
      formatError(e);
      loading = false;
    } 

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


  const clickRegisterPasskey = async () => {
    // Close popover after click
    popoverApi.setOpen(false);
    loading = true;
    try {
      const passkeyPromise = registerPasskey("Proxy Account Passkey", message); 
      // Replaced toastTransaction with toaster.promise
      toaster.promise(passkeyPromise, {
        loading: { title: "Creating Passkey" },
        success: { title: "Passkey Created" },
        error: { title: "Error", description: "Error creating passkey" }
      });
      registered = await passkeyPromise;
    } catch (e) {
      console.error('Error creating passkey', e);
      toaster.create({
        title: "Error creating passkey",
        type: "error",
        duration: 5000,
        // pauseOnHover: true
      });
    } finally {
      loading = false;
    }
  }

  const clickAddPassKey = async () => {
    loading = true;

    const pkPromise = getPasskeyCredential(message, {  
      debug: true, 
      registerName: "Proxy Account Passkey", 
      ...(registered ? { id: registered?.id } : {})
    }); 
    
    // Replaced toastTransaction with toaster.promise
    toaster.promise(pkPromise, {
      loading: { title: "Verifying Passkey" },
      success: { title: "Passkey Verified" },
      error: { title: "Error", description: "Error verifying passkey" }
    });

    pkPromise.then(cred => {
      console.log('passkey cred', cred);
      if (!cred.passkey.pubkey) {
        const id = urlToBase64(cred.passkey.id);
        const loaded = loadPasskeyById(id);
        console.log('loaded passkey from object', loaded);
        if (loaded) {
          cred.passkey.pubkey = loaded.publicKey;
        } else {
          console.error('Error loading passkey by id', cred.passkey.id);
        }
      }
      cred.passkey.pubkey ??= registered?.publicKey;
      
      // Add passkey to existing credentials
      credentials = [...credentials.filter(c => !('passkey' in c)), cred];
      
      // Update the account data with new credentials
      const accountData : CredentialData = {
        credentials,
        with_caller: false
      };
      
      createMsg = createAccountMsg(
        $relayingAddress!,
        { denom: $feeCoin!.denom, amount: $feeCoin!.amount },
        accountData,
      );

      console.log('Updated create msg with passkey', createMsg);
    })
    .catch((e) => {
      console.error('Error creating passkey credential', e);
      toaster.create({
        title: "Error adding passkey",
        type: "error",
        duration: 5000,
        // pauseOnHover: true
      });
    })
    .finally(() => {
      loading = false;
    })
  };

  const clickCancel = () => {
		closeModal(); // Replaced modalStore.clear()
	};


  let prevChainId = $state('');
  let prevInTokenDenom = $state('');
  let prevOutTokenDenom = $state('');
  let prevInValue = $state(0);

  $effect(() => {
    const chain = $selectedChain;
    if (chain && chain.id !== prevChainId) {
      prevChainId = chain.id;
      updateChain(chain);
    }
  });
  
  $effect(() => {
    const inTokenDenom = $inToken?.denom || '';
    const outTokenDenom = $outToken?.denom || '';
    const inVal = $inValue || 0;
    
    if (inTokenDenom !== prevInTokenDenom || 
        outTokenDenom !== prevOutTokenDenom || 
        inVal !== prevInValue) {
      prevInTokenDenom = inTokenDenom;
      prevOutTokenDenom = outTokenDenom;
      prevInValue = inVal;
      directRes.set(null);
    }
  });

</script>


<InTokens tokens={inTokens} />
<OutTokens tokens={outTokens} />

<!-- Replaced old popup with Zag Popover -->
<button {...popoverApi.getTriggerProps()} class="flex justify-end ml-2">
  <span class="material-icons text-sm">keyboard_arrow_down</span>
</button>

{#if popoverApi.open}
  <div use:portal {...popoverApi.getPositionerProps()}>
    <div {...popoverApi.getContentProps()} class="absolute w-32 z-50 btn rounded-container bg-glass bg-glass-shadow py-2 pe-3 text-sm border border-white/20">
      <button disabled={loading} onclick={clickRegisterPasskey}>
        Register New
      </button>
    </div>
  </div>
{/if}

<GhostBox styles="w-full md:w-2/3 lg:w-1/2 px-5 overflow-auto max-h-screen pt-3">

  <ElevatedBox><h3 class="h3 font-bold my-2">Create an Account (+Deposit)</h3></ElevatedBox>

  {#if $inToken && $routeValues  }
      
    {@const { outUSD, outValue } = $routeValues }
    
    <div class="py-7 pb-3 md:px-3 flex flex-col justify-between gap-5">

        <InTokenInput disabled={loading} tokens={inTokens} />

        {#if createMsg && controlAddress }
        
          <div class="border-b border-grey-100 relative py-2 mb-7">

            <div class="absolute top-1 sm:top-2 left-2 text-xs">Controlling with</div>
            
            <div class="pt-5 pb-2 flex flex-col gap-3">
              {#each credentials as cred, index }
                {#if 'eth_personal_sign' in cred }
                  <div class="flex w-full justify-between items-center">
                    <div class="px-2 sm:px-3 md:px-7 text-sm sm:text-md flex items-center gap-2">
                      <span class="font-semibold text-xs bg-blue-500/20 px-2 py-1 rounded">ETH</span>
                      {formatAddress(cred.eth_personal_sign.signer, 10)}
                    </div>
                    {#if $walletIcon}
                      <img src={$walletIcon} alt="wallet icon" class="w-6 h-6" />
                    {/if}
                  </div>
                {:else if 'passkey' in cred }
                  <div class="flex w-full justify-between items-center">
                    <div class="px-2 sm:px-3 md:px-7 text-sm sm:text-md flex items-center gap-2">
                      <span class="font-semibold text-xs bg-green-500/20 px-2 py-1 rounded">KEY</span>
                      <span>Passkey Authentication</span>
                      {#if cred.passkey.user_handle}
                        <span class="text-xs text-gray-400">({cred.passkey.user_handle})</span>
                      { /if }
                    </div>
                    <div class="w-6 h-6 flex items-center justify-center">
                      <span class="material-icons text-green-500 text-lg">fingerprint</span>
                    </div>
                  </div>
                {/if}
              {/each}
              
              {#if credentials.length === 1 && credentials.some(c => 'eth_personal_sign' in c) }
                <div class="flex w-full justify-center mt-2 relative">
                  <ElevatedButtonBox 
                    onClick={clickAddPassKey}
                    disabled={loading}
                    small={true}
                  >
                    <span>+ Add Passkey (Optional)</span>
                  </ElevatedButtonBox>
                </div>
              { /if }
            </div>
          </div>
        { /if }

        <div class="relative ">
          <label class="absolute top-1 left-2 label text-xs text-gray-200 " for="recieve">Recieve</label>
          <div class="flex w-full justify-between items-stretch gap-3 " >
            
            <div class="border-b border-grey-100 text-lg py-5 px-1 sm:px-7 w-full flex gap-3 relative  sm:py-7">
              {#if outUSD && outUSD != "0.00" }
                <span class="absolute bottom-1 left-3 sm:left-7 label text-xs text-gray-200 ">( ${outUSD} )</span>
              {/if }
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

            <ElevatedButtonBox styles="preset-filled-primary-500" 
              onClick={onClick} 
              disabled={loading} small={false}
            >

              {#if loading }
                <Progress value={undefined} class="w-6" />
              {:else if $directRes }
                Create
              {:else if !createMsg }
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

<style>
  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 18px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    font-feature-settings: 'liga';
    -webkit-font-feature-settings: 'liga';
    -webkit-font-smoothing: antialiased;
  }
</style>