<script lang="ts">
    import { Listbox, useListCollection, type ListboxRootProps } from '@skeletonlabs/skeleton-svelte';
    import { outToken, routeValues, updateOutToken } from "$lib/values";
    import type { Token } from "$lib/types";
    
    interface Props {
        tokens?: Token[];
    }
    
    let { tokens = [] }: Props = $props();

    const collection = $derived(
        useListCollection({
            items: tokens,
            itemToString: (item) => item.fullName,
            itemToValue: (item) => item.denom,
        }),
    );

    const onValueChange: ListboxRootProps['onValueChange'] = (details) => {
        if (details.value && details.value.length > 0) {
            const selectedDenom = details.value[0];
            const selectedToken = tokens.find(t => t.denom === selectedDenom);
            if (selectedToken) {
                updateOutToken($routeValues, selectedToken, false);
            }
        }
    };
</script>


<div data-popup="outTokens" class="shadow-xl z-50 bg-zinc-900/90 overflow-auto max-h-24 sm:max-h-screen">
  <Listbox class="rounded-none preset-filled-primary-500 p-1 sm:p-2" {collection} {onValueChange}>
    <Listbox.Content>
      {#each collection.items as token (token.denom)}
        <Listbox.Item item={token}>
          <div class="flex gap-1 sm:gap-5 justify-between items-center">
            <img src="{token.meta.logo}" alt="{token.name} logo" class="w-5 h-5" />
            <div class="flex w-full justify-center">
              {token.fullName}
            </div>
          </div>
          <Listbox.ItemIndicator />
        </Listbox.Item>
      {/each}
    </Listbox.Content>
  </Listbox>
</div> 