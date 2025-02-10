<script lang="ts">
    export let styles : string = '';
    export let onClick : (_ : any) => void = () => {};
    export let disabled : boolean = false;
    export let selected : boolean = false;
    $: selectedStyles = selected ? 'border-2' : '';
</script>

<button 
    on:click={onClick} 
    {disabled}
    class="btn rounded-container-token bg-glass bg-glass-shadow text-sm {selectedStyles} {styles}"
>
    <slot />
</button>