<script lang="ts">
    import Box from "./box.svelte";
    import { selectedChain } from "$lib/chains";
    import { appKit } from "$lib/appkit";
        
    let chainName = "", icon = "";

    $: if ($selectedChain) {
        chainName = $selectedChain.name
        icon = $selectedChain.logo
    }
    
    const onClick = () => {
        appKit.open({ view: "Networks" });
    }

</script>





<Box styles="w-36">
    <button class="flex items-center justify-between gap-2" on:click={onClick}>
        <div class="flex-center gap-3 text-center px-1">
            {#if icon}
                <img src={icon} alt="chain icon" class="w-4 h-4" />
            {/if}
            <span class="text-sm">{chainName}</span>
        </div>
        <div class="arrow bg-surface-100-800-token" />
    </button>
</Box>

