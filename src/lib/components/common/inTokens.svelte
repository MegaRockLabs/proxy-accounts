<script lang="ts">
  import { ListBox, ListBoxItem } from "@skeletonlabs/skeleton";
  import { inToken, routeValues, updateInToken } from "$lib/values";
  import type { Token } from "$lib/types";
  export let tokens : Token[] = [];
</script>


<div data-popup="inTokens" class="shadow-xl z-50 bg-zinc-900/90">
  <ListBox rounded="rounded-none" active="bg-primary-active-token" padding="p-1 sm:p-2">
    { #each tokens as token (token.denom)}
      <ListBoxItem 
        bind:group={$inToken} name="intoken" 
        value={token} on:change={() => updateInToken($routeValues, token, false)}
      >
        <div class="flex gap-1 sm:gap-5 justify-between items-center ">
          <img src="{token.meta.logo}" alt="{token.name} logo" class="w-5 h-5" />
          <div class="flex w-full justify-center">
            {token.fullName}
          </div>
        </div>
      </ListBoxItem>
    { /each }
  </ListBox>
</div>  