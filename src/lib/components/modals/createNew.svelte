<script lang="ts">
  import { fromHex, toBase64, toUtf8 } from '@cosmjs/encoding';
  import { Dialog, Portal, Progress } from "@skeletonlabs/skeleton-svelte";
  import { untrack } from 'svelte';
  import { messagesDirect } from '@skip-go/client';
  import { signMessage } from '@wagmi/core';
  import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx';
  import type { Coin } from '@cosmjs/stargate';
  import type { CredentialData } from 'smart-account-auth';
  import { 
    getPasskeyCredential,
    loadPasskeyById,
    type PasskeyInfo,
    urlToBase64,
  } from 'smart-account-auth';

  import ElevatedButtonBox from '../common/elevatedButtonBox.svelte';
  import ElevatedBox from "../common/elevatedBox.svelte";
  import GhostBox from '$lib/components/common/ghostBox.svelte';
  import InTokenInput from '../common/inTokenInput.svelte';
  import OutTokenButton from '../common/outTokenButton.svelte';
  import Calculated from '../common/calculated.svelte';
  
  import { selectedChain } from '$lib/chains';
  import type { Chain, CosmosToken, RouteValues, Token } from '$lib/types';
  import { BASESCAN, chainIdsToAddresses, NEUTRON_DENOM, NEUTRON_ID, NEUTRON_REGISTRY, SKIP_COMMON } from '$lib/vars';
  import { getInTokens, NTRN } from '$lib/tokens';
  import { userAddress, createAccountMsg } from '$lib/accounts';
  import { cosmosClient, relayingClient } from '$lib/clients';
  import { getWagmiConnector, relayingAddress, wagmiAdapter, walletIcon } from '$lib/signers';
  import { accountCreationFees } from '$lib/registry';
  import { directRes, executeRouteOwn, setDirectResponse, viewTxAction } from '$lib/routes';
  import { inToken, inValue, outToken, routeValues, updateInToken, updateOutToken } from '$lib/values';
  import { formatAddress, formatError } from '$lib/utils';
  import { deleteBridgeTask, onEthAddressFound } from '$lib';
  import { createToaster } from '@skeletonlabs/skeleton-svelte';

  // Props
  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), onOpenChange }: Props = $props();

  const toaster = createToaster({ placement: 'top-end' });

  // State
  let step = $state(1); // 1 = credentials, 2 = swap
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
  });

  const feeCoin = $derived(
    $accountCreationFees.find((fee: Coin) => fee.denom === NEUTRON_DENOM)!
  );

  // Functions
  async function simulateCreation(values?: RouteValues) {
    values ??= $routeValues;
    const fee = $accountCreationFees.find(fee => fee.denom === NEUTRON_DENOM);
    if (!values || !fee || !createMsg) return;

    const encoded = MsgExecuteContract.fromPartial({
      contract: NEUTRON_REGISTRY,
      msg: toUtf8(JSON.stringify(createMsg)),
      sender: $relayingAddress,
      funds: [{ denom: fee.denom, amount: fee.amount }]
    });

    await $relayingClient.simulate(
      $relayingAddress, 
      [{ typeUrl: MsgExecuteContract.typeUrl, value: encoded }],
      ""
    );
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
      destAssetDenom: values.outToken.denom,
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
      const vals = await setDirectResponse(values, dirRes, $userAddress, sourceAssetChainID, undefined, feeCoin);
      if (vals.outValue < 5) {
        throw new Error('Must receive at least 5 NTRN to cover future fees');
      }
      await simulateCreation(vals);
      return vals;
    })
    .then(vals => {
      error = '';
    })
    .catch(e => {
      console.error('Error calculating creation messages', e);
      error = formatError(e);
      directRes.set(null);
    })
    .finally(() => loading = false);
  };

  const signCreateMsg = async () => {
    const wagmi = $wagmiAdapter;
    const connector = await getWagmiConnector(wagmi);
    const addresses = await connector.getAccounts();
    const account = addresses[0].toLowerCase() as `0x${string}`;

    const signature = await signMessage(wagmi.wagmiConfig, {
      message,
      account,
      connector
    });

    const sigBytes = fromHex(signature.slice(2));
    const ethCred = {
      eth_personal_sign: {
        signer: account,
        signature: toBase64(sigBytes),
        message: toBase64(toUtf8(message))
      }
    };

    credentials = [ethCred];
    const accountData: CredentialData = { credentials, with_caller: false };
    
    createMsg = createAccountMsg(
      $relayingAddress!,
      { denom: feeCoin.denom, amount: feeCoin.amount },
      accountData,
    );

    controlAddress = account;

    // Simulate creation with arbitrary funds
    try {
      const arbitraryValues: RouteValues = {
        ...$routeValues,
        inToken: $inToken!,
        outToken: NTRN,
        inValue: 1,
        inParsed: BigInt(1000000),
        outValue: 1,
        outUSD: "1.00",
        routeSecs: 0,
        estimatedFees: []
      } as RouteValues;
      
      await simulateCreation(arbitraryValues);
    } catch (e) {
      console.error('Error simulating creation', e);
    }
  };

  const proceedToSwap = () => {
    if (credentials.length > 0) {
      step = 2;
    }
  };

  const create = async () => {
    const values = $routeValues;
    const direct = $directRes!;

    if (!direct || !values || direct?.txs?.length != 1) return;

    try {
      let { txHash, promise } = await executeRouteOwn(direct.txs, direct.route!, values, $cosmosClient, true);
      const expLink = BASESCAN + txHash;

      if (values.routeSecs > 50) {
        toaster.info({
          title: "Broadcasted",
          description: txHash,
        });
        promise = new Promise((resolve) => resolve(null));
      } else {
        toaster.promise(promise, {
          loading: { title: "Creating Account" },
          success: { title: "Success" },
          error: { title: "Error" }
        });
      }

      promise.then(accress => {
        error = '';
        deleteBridgeTask(txHash);
        open = false;
        onEthAddressFound($wagmiAdapter, $selectedChain.id, $cosmosClient, $userAddress);
      })
      .catch(e => {
        console.error('Error depositing route', e);
        error = formatError(e);
      })
      .finally(() => {
        directRes.set(null);
        loading = false;
      });
    } catch (e) {
      console.error('Error creating account', e);
      formatError(e);
      loading = false;
    } 
  };

  const onClick = async () => {
    error = '';
    loading = true;

    try {
      if (step === 1) {
        // Step 1: Sign the message with wallet
        await signCreateMsg();
      } else if (!$directRes) {
        // Step 2: Calculate route
        await calculateRoute();
      } else {
        // Step 2: Execute creation
        await create();
      }
    } catch (e) {
      console.error('Error creating account', e);
      error = formatError(e);
    } 

    loading = false;
  };

  const clickAddPassKey = async () => {
    loading = true;

    const pkPromise = getPasskeyCredential(message, {  
      debug: true, 
      registerName: "Proxy Account Passkey", 
      ...(registered ? { id: registered?.id } : {})
    }); 
    
    toaster.promise(pkPromise, {
      loading: { title: "Verifying Passkey" },
      success: { title: "Passkey Verified" },
      error: { title: "Error", description: "Error verifying passkey" }
    });

    pkPromise.then(cred => {
      if (!cred.passkey.pubkey) {
        const id = urlToBase64(cred.passkey.id);
        const loaded = loadPasskeyById(id);
        if (loaded) {
          cred.passkey.pubkey = loaded.publicKey;
        } else {
          console.error('Error loading passkey by id', cred.passkey.id);
        }
      }
      cred.passkey.pubkey ??= registered?.publicKey;
      
      credentials = [...credentials.filter(c => !('passkey' in c)), cred];
      const accountData: CredentialData = { credentials, with_caller: false };
      
      createMsg = createAccountMsg(
        $relayingAddress!,
        { denom: feeCoin.denom, amount: feeCoin.amount },
        accountData,
      );

      // Simulate creation with arbitrary funds
      try {
        const arbitraryValues: RouteValues = {
          ...$routeValues,
          inToken: $inToken!,
          outToken: NTRN,
          inValue: 1,
          inParsed: BigInt(1000000),
          outValue: 1,
          outUSD: "1.00",
          routeSecs: 0,
          estimatedFees: []
        } as RouteValues;
        
        simulateCreation(arbitraryValues);
      } catch (e) {
        console.error('Error simulating creation', e);
      }
    })
    .catch((e) => {
      console.error('Error creating passkey credential', e);
      toaster.error({ title: "Error adding passkey" });
    })
    .finally(() => {
      loading = false;
    });
  };

  // Effects - only initialize tokens when modal opens or chain changes
  let initializedChainId = $state('');
  
  $effect(() => {
    const chain = $selectedChain;
    // Only run when the modal is open and chain actually changed
    if (open && chain && chain.id !== initializedChainId) {
      initializedChainId = chain.id;
      inChain = chain;
      outTokens = [NTRN];
      inTokens = getInTokens(chain);
      
      // Use untrack to prevent these updates from triggering effects
      untrack(() => {
        updateInToken($routeValues ?? {}, inTokens[0])
          .then(val => updateOutToken(val, NTRN));
      });
    }
  });
  
  $effect(() => {
    // Only clear directRes when modal is open and inputs change
    if (open && ($inToken?.denom || $outToken?.denom || $inValue)) {
      untrack(() => {
        directRes.set(null);
      });
    }
  });
</script>

<Dialog
  open={open}
  onOpenChange={(details) => {
    open = details.open;
    onOpenChange?.(details.open);
    if (!details.open) {
      // Reset state when closing
      step = 1;
      credentials = [];
      createMsg = undefined;
      controlAddress = undefined;
      error = '';
      directRes.set(null);
    }
  }}
>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Dialog.Content class="relative bg-surface-900 border border-surface-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-surface-700">
          <Dialog.Title class="text-xl font-semibold">
            {#if step === 1}
              Setup Credentials
            {:else}
              Create Account & Deposit
            {/if}
          </Dialog.Title>
          <Dialog.CloseTrigger class="hover:bg-surface-800 rounded-md p-1.5 transition-colors">
            <span class="material-icons text-lg">close</span>
          </Dialog.CloseTrigger>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto flex-1">
          {#if step === 1}
            <!-- STEP 1: Credentials Screen -->
            <div class="px-6 py-6 space-y-6">
              <div class="text-center space-y-2">
                <p class="text-base text-gray-200">Connect your Ethereum wallet to control your account</p>
                <p class="text-sm text-gray-400">You can optionally add a passkey for additional security</p>
              </div>

              {#if !createMsg}
                <div class="flex items-center justify-center py-12">
                  <ElevatedButtonBox 
                    styles="preset-filled-primary-500" 
                    onClick={onClick} 
                    disabled={loading} 
                    small={false}
                  >
                    {#if loading}
                      <Progress value={undefined} class="w-6" />
                    {:else}
                      Sign with Ethereum Wallet
                    {/if}
                  </ElevatedButtonBox>
                </div>
              {:else}
                <div class="space-y-4">
                  <div class="rounded-lg border border-surface-700 bg-surface-800/50 p-4">
                    <div class="text-xs text-gray-400 mb-3">Controlling with</div>
                    
                    <div class="space-y-3">
                      {#each credentials as cred, i (i)}
                        {#if 'eth_personal_sign' in cred}
                          <div class="flex items-center justify-between p-3 rounded-md bg-surface-900/50 border border-surface-700">
                            <div class="flex items-center gap-3">
                              <span class="font-semibold text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded">ETH</span>
                              <span class="text-sm font-mono">{formatAddress(cred.eth_personal_sign.signer, 10)}</span>
                            </div>
                            {#if $walletIcon}
                              <img src={$walletIcon} alt="wallet icon" class="w-6 h-6 rounded" />
                            {/if}
                          </div>
                        {:else if 'passkey' in cred}
                          <div class="flex items-center justify-between p-3 rounded-md bg-surface-900/50 border border-surface-700">
                            <div class="flex items-center gap-3">
                              <span class="font-semibold text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded">KEY</span>
                              <div class="flex items-center gap-2">
                                <span class="text-sm">Passkey Authentication</span>
                                {#if cred.passkey.user_handle}
                                  <span class="text-xs text-gray-400">({cred.passkey.user_handle})</span>
                                {/if}
                              </div>
                            </div>
                            <div class="w-6 h-6 flex items-center justify-center">
                              <span class="material-icons text-green-400 text-lg">fingerprint</span>
                            </div>
                          </div>
                        {/if}
                      {/each}
                      
                      {#if credentials.length === 1 && credentials.some(c => 'eth_personal_sign' in c)}
                        <div class="flex justify-center pt-2">
                          <button 
                            class="btn btn-sm variant-ghost-surface hover:variant-soft-surface"
                            disabled={loading}
                            onclick={clickAddPassKey}
                          >
                            <span class="material-icons text-sm mr-1">add</span>
                            Add Passkey (Optional)
                          </button>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}

              {#if error}
                <div class="rounded-lg border border-error-500/20 bg-error-500/10 px-4 py-3 text-sm text-error-400">
                  {error}
                </div>
              {/if}
            </div>

            <!-- Footer -->
            {#if createMsg}
              <div class="px-6 py-4 border-t border-surface-700 bg-surface-900/50">
                <div class="flex justify-end gap-3">
                  <Dialog.CloseTrigger>
                    <ElevatedButtonBox selected small={false}>Cancel</ElevatedButtonBox>
                  </Dialog.CloseTrigger>

                  <ElevatedButtonBox 
                    styles="preset-filled-primary-500" 
                    onClick={proceedToSwap} 
                    disabled={loading || credentials.length === 0} 
                    small={false}
                  >
                    Continue to Deposit
                  </ElevatedButtonBox>
                </div>
              </div>
            {/if}

          {:else}
            <!-- STEP 2: Swap/Deposit Screen -->
            {#if $inToken && $routeValues}
              {@const { outUSD, outValue } = $routeValues}
              
              <div class="px-6 py-6 space-y-6">
                <InTokenInput disabled={loading} tokens={inTokens} />

                <div>
                  <label class="block text-xs text-gray-400 mb-2" for="receive">Receive</label>
                  <div class="flex items-stretch gap-3">
                    <div class="flex-1 rounded-lg border border-surface-700 bg-surface-800/50 px-4 py-4 relative">
                      <div class="text-lg font-medium">
                        {outValue ? outValue.toFixed(4) : "឴"}
                      </div>
                      {#if outUSD && outUSD != "0.00"}
                        <div class="text-xs text-gray-400 mt-1">${outUSD}</div>
                      {/if}
                    </div>
                    <OutTokenButton disabled={true} token={NTRN} tokens={[NTRN]} />
                  </div>
                </div>

                <Calculated {error} creating={true} />
                
                {#if error}
                  <div class="rounded-lg border border-error-500/20 bg-error-500/10 px-4 py-3 text-sm text-error-400">
                    {error}
                  </div>
                {/if}
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 border-t border-surface-700 bg-surface-900/50">
                <div class="flex justify-end gap-3">
                  <ElevatedButtonBox 
                    onClick={() => step = 1} 
                    disabled={loading} 
                    small={false}
                  >
                    Back
                  </ElevatedButtonBox>

                  <ElevatedButtonBox 
                    styles="preset-filled-primary-500" 
                    onClick={onClick} 
                    disabled={loading} 
                    small={false}
                  >
                    {#if loading}
                      <Progress value={undefined} class="w-6" />
                    {:else if $directRes}
                      Create
                    {:else}
                      Calculate Route
                    {/if}
                  </ElevatedButtonBox>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>

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
