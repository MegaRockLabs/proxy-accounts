<script lang="ts">
    import type { Token } from "$lib/types";
    import { outToken, routeValues, updateOutToken } from "$lib/values";
    import { ListBox, ListBoxItem } from "@skeletonlabs/skeleton";
    export let tokens : Token[] = [];
  </script>
  


<div data-popup="outTokens" class="shadow-xl z-50 bg-zinc-900/90 overflow-auto max-h-24 sm:max-h-screen">
  <ListBox rounded="rounded-none" active="bg-primary-active-token" padding="p-1 sm:p-2">
    { #each tokens as token }
      <ListBoxItem bind:group={$outToken} name="outoken" 
        value={token} on:change={() => updateOutToken($routeValues, token, false)}
      >
        <div class="flex gap-1 sm:gap-5 justify-between items-center">
          <img src="{token.meta.logo}" alt="{token.name} logo" class="w-5 h-5" />
          <div class="flex w-full justify-center">
            {token.fullName}
          </div>
        </div>
      </ListBoxItem>
    { /each }
  </ListBox>
</div> 