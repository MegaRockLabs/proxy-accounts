<script lang="ts">
  import { popup } from "@skeletonlabs/skeleton";
  import { outTokensPopup, routeValues } from "$lib/values";
  import type { Token } from "$lib/types";
  export let disabled : boolean = false;
  export let token : Token | null = null;
  $: outToken = token ?? $routeValues.outToken;
</script>


<button 
  class="btn btn-sm gap-1 sm:gap-2  bg-zinc-900/80 w-24 sm:w-72   justify-center items-center px-1 sm:px-3 md:px-5" 
  use:popup={outTokensPopup} {disabled}
>
  <div class="flex flex-col sm:flex-row gap-1 sm:gap-3 items-center text-sm sm:text-sm lg:text-md">
    <img src="{outToken.meta.logo}" alt="{outToken.name} logo" class="w-4 h-4 sm:w-7 sm:h-7" />
    <span>{outToken.symbol ?? ""}</span>
    <span class="material-icons">arrow_drop_down</span>
  </div>
</button>


<style>
  @media (max-width: 640px) {
    .material-icons {
      font-size: 10px;
    }
  }
</style>