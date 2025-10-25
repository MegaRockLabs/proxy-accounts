<script lang="ts">
    import { run } from 'svelte/legacy';

    import CopyButton from "$lib/components/common/copyButton.svelte";
    import { foundAccountInfo } from "$lib/accounts";
    
    let justClicked = $state(false);

    interface Props {
        header?: string;
    }

    let { header = "Balances" }: Props = $props();
    
    let hasAccount = $derived(Boolean($foundAccountInfo));
    let address = $derived(hasAccount ? $foundAccountInfo!.address : "");

    run(() => {
        if (justClicked) {
            setTimeout(() => justClicked = false, 1000);
        }
    });

    
</script>


<div class="flex justify-between items-center my-2 md:mt-8">

    <h1 class="text-lg md:text-2xl font-bold">{header}</h1>

    {#if address}
        <CopyButton {address} />
    { /if }

</div>