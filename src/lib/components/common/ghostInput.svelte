<script lang="ts">
    import ElevatedButtonBox from "./elevatedButtonBox.svelte";

    export let value : string | number | undefined;
    export let max   : string | number | undefined = undefined;
    export let min   : string | number | undefined = undefined;
    export let step  : string | number | undefined = min ?? 1;

    export let placeholder : string = "";
    
    export let styles = "";
    export let inputStyles = "";

    const inputClass = `p-2 ${inputStyles}`;

    export let handleMax : () => void = () => {
        value = max;
    }

</script>

<div class={`input-group rounded-container-token flex bg-glass-darker ${styles}`}>
    {#if min || max}
        <input class={`flex-1 min-w-0 ${inputClass}`} type="number" {placeholder} {step} {max} {min} bind:value={value}/>
        <ElevatedButtonBox styles="m-1.5 flex-shrink-0" on:click={handleMax}>Max</ElevatedButtonBox>
    {:else}
        <input class={`flex-1 ${inputClass}`} type="text" {placeholder} bind:value={value}/> 
    {/if}
</div>

