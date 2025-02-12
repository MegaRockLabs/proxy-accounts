<script lang="ts">
  import { popup } from "@skeletonlabs/skeleton";
  import { inToken, inTokensPopup, inValue, routeValues, updateInValue } from "$lib/values";
  import { accountBalanceMap } from "$lib/assets";
  
  export let disabled : boolean = false;
  $: token = $inToken ?? $routeValues.inToken;
  
</script>


<div class="border border-grey-100 rounded-container-token relative ">
  
  <label class="absolute top-2 left-2 label text-xs text-gray-200 " for="pay">Pay</label>
  { #if $routeValues.inUSD }
    <span class="absolute bottom-2 left-7 text-xs text-gray-200 ">( ${$routeValues.inUSD} )</span>
  {/if}

  <div class="flex w-full justify-between items-stretch   ">
    
    <input 
      id="pay" type="number" 
        class="p-1 sm:p-7 flex w-full bg-transparent border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
        step={token.meta.step ?? token.meta.min} 
        min={token.meta.min} 
        max={accountBalanceMap[token.denom]?.amount || undefined}
        on:change={() => updateInValue($routeValues, $inValue)}
        bind:value={$inValue}
        {disabled}
    />

    <button 
      class="btn btn-sm gap-1 sm:gap-2  bg-zinc-900/80 w-24 sm:w-72 justify-center items-center px-1 sm:px-3 md:px-5" 
      use:popup={inTokensPopup} {disabled}
    >
      <div class="flex flex-col sm:flex-row gap-1 sm:gap-3 items-center text-xs sm:text-sm lg:text-md">
        <img src="{token.meta.logo}" alt="{token.name} logo" class="w-4 h-4 sm:w-7 sm:h-7" />
        <span>{token.symbol ?? ""}</span>
        <span class="material-icons">arrow_drop_down</span>
      </div>
    </button>

  </div>
</div>

<style>

  @media (max-width: 640px) {
    .material-icons {
      font-size: 10px;
    }
  }

</style>