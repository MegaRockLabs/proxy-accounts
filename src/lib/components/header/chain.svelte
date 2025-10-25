<script lang="ts">
    import Box from "./box.svelte";
    import { selectedChain } from "$lib/chains";
    import { appKit } from "$lib/appkit";
        
    let chainName = $state("");
    let icon = $state("");
    let prevChainId = $state<string | undefined>(undefined);

        
    $effect(() => {
        const chain = $selectedChain;
        
        
        console.log("Selected chain changed:", chain);
        prevChainId = chain.id;
        chainName = chain.name;
        icon = chain.logo;
        if (chain && chain.id !== prevChainId) {
        }
    });
    
    $inspect("selecred chin:", $selectedChain);
    
    const onClick = () => {
        appKit.open({ view: "Networks" });
    }

</script>





<Box styles="w-36">
    <button class="flex items-center justify-between gap-2" onclick={onClick}>
        <div class="flex-center gap-3 text-center px-1">
            {#if icon}
                <img src={icon} alt="chain icon" class="w-4 h-4" />
            {/if}
            <span class="text-sm">{chainName}</span>
        </div>
        <div class="arrow bg-surface-100-900"></div>
    </button>
</Box>

