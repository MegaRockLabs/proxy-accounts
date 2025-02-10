<script lang="ts">
    export let styles : string = '';
    export let small : boolean = true;
    export let onClick : (_ : any) => void = () => {};
    export let disabled : boolean = false;
    export let selected : boolean = false;
    $: selectedStyles = selected ? 'bg-glass-darker' : '';
</script>

<button 
    on:click={onClick} 
    {disabled}
    class="btn btn-xl bg-glass bg-glass-shadow rounded-container-token py-2 px-3 border border-white/20 {small ? "text-sm" : ""} {selectedStyles} {styles}"
>
<!-- 
  -->
    <slot />
</button>

