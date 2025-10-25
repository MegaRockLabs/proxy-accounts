<script lang="ts">
  import { Popover, Portal, Listbox, useListCollection, type ListboxRootProps } from '@skeletonlabs/skeleton-svelte';
  import { routeValues, updateOutToken } from "$lib/values";
  import type { Token } from "$lib/types";
  
  interface Props {
    disabled?: boolean;
    token?: Token | null;
    tokens?: Token[];
  }

  let { disabled = false, token = null, tokens = [] }: Props = $props();
  let outToken = $derived(token ?? $routeValues.outToken);
  
  // Listbox collection for token selection
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


<Popover>
  <Popover.Trigger 
    class="btn btn-sm gap-1 sm:gap-2 bg-zinc-900/80 w-24 sm:w-72 justify-center items-center px-1 sm:px-3 md:px-5" 
    {disabled}
  >
    <div class="flex flex-col sm:flex-row gap-1 sm:gap-3 items-center text-sm sm:text-sm lg:text-md">
      <img src="{outToken.meta.logo}" alt="{outToken.name} logo" class="w-4 h-4 sm:w-7 sm:h-7" />
      <span>{outToken.symbol ?? ""}</span>
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


<style>
  @media (max-width: 640px) {
    .material-icons {
      font-size: 10px;
    }
  }
</style>