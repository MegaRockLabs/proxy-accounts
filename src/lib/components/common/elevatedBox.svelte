<script lang="ts">
    export let styles: string = '';
    export let selected: boolean = false;
    export let shadow: boolean = false;

    $: borderStyles = selected ? 'border-2' : '';
    $: shadowStyles = shadow ? 'bg-glass-shadow' : '';
</script>

<div  class="rounded-container-token bg-glass p-1 md:p-2 {borderStyles} {shadowStyles} {styles}">
    <slot />
</div>
