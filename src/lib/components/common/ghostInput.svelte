<script lang="ts">
    import ElevatedButtonBox from "./elevatedButtonBox.svelte";


    

    const inputClass = `p-2 ${inputStyles}`;

    interface Props {
        value: string | number | undefined;
        max?: string | number | undefined;
        min?: string | number | undefined;
        step?: string | number | undefined;
        placeholder?: string;
        styles?: string;
        inputStyles?: string;
        handleMax?: () => void;
    }

    let {
        value = $bindable(),
        max = undefined,
        min = undefined,
        step = min ?? 1,
        placeholder = "",
        styles = "",
        inputStyles = "",
        handleMax = () => {
        value = max;
    }
    }: Props = $props();

</script>

<div class={`input-group rounded-container-token flex bg-glass-darker ${styles}`}>
    {#if min || max}
        <input class={`flex-1 min-w-0 ${inputClass}`} type="number" {placeholder} {step} {max} {min} bind:value={value}/>
        <ElevatedButtonBox styles="m-1.5 shrink-0" on:click={handleMax}>Max</ElevatedButtonBox>
    {:else}
        <input class={`flex-1 ${inputClass}`} type="text" {placeholder} bind:value={value}/> 
    {/if}
</div>

