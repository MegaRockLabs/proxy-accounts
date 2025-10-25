<script lang="ts">
  import { Popover, Portal, Listbox, useListCollection, type ListboxRootProps } from '@skeletonlabs/skeleton-svelte';
  import { inToken, inValue, routeValues, updateInValue, updateInToken } from "$lib/values";
  import { accountBalanceMap, getEthBalance } from "$lib/assets";
  import ElevatedButtonBox from "./elevatedButtonBox.svelte";
  import { formatUnits, parseUnits } from "viem";
  import type { Token } from "$lib/types";
  import { NTRN } from "$lib/tokens";
  import { wagmiAdapter } from "$lib/signers";
  import { selectedChain } from "$lib/chains";
  import { userAddress } from "$lib/accounts";
  import type { ChangeEventHandler } from "svelte/elements";
  
  
  interface Props {
    disabled?: boolean;
    tokens?: Token[];
  }

  let { disabled = false, tokens = [] }: Props = $props();

  let token = $derived($inToken ?? $routeValues.inToken);
  let balance : bigint, balanceHuman : string = $state("");
  
  // Listbox collection for token selection
  const collection = $derived(
    useListCollection({
      items: tokens,
      itemToString: (item) => item.fullName,
      itemToValue: (item) => item.denom,
    }),
  );

  const onValueChange: ListboxRootProps['onValueChange'] = (details) => {
    console.log('[InTokenInput] onValueChange triggered:', details.value);
    if (details.value && details.value.length > 0) {
      const selectedDenom = details.value[0];
      const selectedToken = tokens.find(t => t.denom === selectedDenom);
      if (selectedToken) {
        console.log('[InTokenInput] Calling updateInToken with:', selectedToken.denom);
        updateInToken($routeValues, selectedToken, false);
      }
    }
  };
  
  
  const updateBalance = async (token : Token) => {
    if (token.denom == NTRN.denom || token.denom.startsWith("ibc/") || token.denom.startsWith("factory/")) {
      const bal = accountBalanceMap[token.denom];
      if (bal) {
        balance = BigInt(bal.amount);
        balanceHuman = bal.amountHuman;
      }
    } else if (token.denom.startsWith("0x") || token.denom.includes("native")) {

      const wagmi = $wagmiAdapter;
      if (!wagmi) return; 

      const isNative = token.denom.includes("native");
      const bal = await getEthBalance(
        wagmi, 
        $selectedChain.id,
        $userAddress,
        isNative ? undefined : token.denom,
      );
      balance = parseUnits(bal, token.decimals);
      balanceHuman = parseFloat(formatUnits(balance, token.decimals)).toFixed(2);
    }
  
  }

  const onChange  = (e : any)  => {
    updateInValue($routeValues, e.target.value);
  }

  const setMax = () => {
    if (!balance || !token) return;
    const num = parseFloat(formatUnits(balance, token.decimals));
    updateInValue($routeValues, num);
  }

  $effect(() => {
    console.log('[InTokenInput] Effect triggered, token:', token?.denom);
    if (token) {
      updateBalance(token);
    }
  });
  
</script>

<div class="mt-3">
  <div class="border border-grey-100 rounded-container relative ">
    
    <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="pay">Give</label>
    {#if $routeValues.inUSD}
      <span class="absolute bottom-2 left-2 sm:left-6 text-xs text-gray-200  ">( ${$routeValues.inUSD} )</span>
    {/if}
  
    <div class="flex w-full justify-between items-stretch">
      
      <input 
        id="pay" type="number" 
          class="py-5 px-3 sm:p-7 flex w-full bg-transparent text-lg border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          step={token.meta.step ?? token.meta.min} 
          min={token.meta.min}
          onchange={onChange}
          bind:value={$inValue}
          {disabled}
      />
  
      <Popover>
        <Popover.Trigger 
          class="btn btn-sm gap-1 sm:gap-2 bg-zinc-900/80 w-24 sm:w-72 justify-center items-center px-1 sm:px-3 md:px-5" 
          {disabled}
        >
          <div class="flex flex-col sm:flex-row gap-1 sm:gap-3 items-center text-xs sm:text-sm lg:text-md">
            <img src="{token.meta.logo}" alt="{token.name} logo" class="w-4 h-4 sm:w-7 sm:h-7" />
            <span>{token.symbol ?? ""}</span>
            <span class="material-icons">arrow_drop_down</span>
          </div>
        </Popover.Trigger>
        
        <Portal>
          <Popover.Positioner>
            <Popover.Content class="shadow-xl z-50 bg-zinc-900/90 rounded-container">
              <Listbox class="rounded-none preset-filled-primary-500 p-1 sm:p-2" {collection} {onValueChange}>
                <Listbox.Content>
                  {#each collection.items as tokenItem (tokenItem.denom)}
                    <Listbox.Item item={tokenItem}>
                      <div class="flex gap-1 sm:gap-5 justify-between items-center">
                        <img src="{tokenItem.meta.logo}" alt="{tokenItem.name} logo" class="w-5 h-5" />
                        <div class="flex w-full justify-center">
                          {tokenItem.fullName}
                        </div>
                      </div>
                      <Listbox.ItemIndicator />
                    </Listbox.Item>
                  {/each}
                </Listbox.Content>
              </Listbox>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover>
    </div>
  </div>

  {#if balanceHuman}
    <div class="w-full flex justify-end gap-2 items-center p-2">
      <div class="flex flex-col">
        <span class="text-xs text-gray-200">Balance:</span>
        <span class="text-xs text-gray-200">{balanceHuman || "0.00"}</span>
      </div>
      <ElevatedButtonBox styles="preset-filled-tertiary-500" {disabled} onClick={setMax}>Max</ElevatedButtonBox>
    </div>
  {/if }

</div>


<style>

  @media (max-width: 640px) {
    .material-icons {
      font-size: 10px;
    }
  }

</style>