<script lang="ts">
    import CopyButton from "$lib/components/common/copyButton.svelte";
    import { foundAccountInfo } from "$lib/accounts";
    
    let justClicked = false;

    export let header = "Balances";
    
    $: hasAccount = Boolean($foundAccountInfo);
    $: address = hasAccount ? $foundAccountInfo!.address : "";

    $: if (justClicked) {
        setTimeout(() => justClicked = false, 1000);
    }

    
</script>


<div class="flex justify-between items-center my-2 md:mt-8">

    <h1 class="text-lg md:text-2xl font-bold">{header}</h1>

    { #if address }
        <CopyButton {address} />
    { /if }

</div>