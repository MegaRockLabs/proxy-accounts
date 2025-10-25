<script lang="ts">
    interface Props {
        styles?: string;
        selected?: boolean;
        shadow?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        styles = '',
        selected = false,
        shadow = false,
        children
    }: Props = $props();

    let borderStyles = $derived(selected ? 'border-2' : '');
    let shadowStyles = $derived(shadow ? 'bg-glass-shadow' : '');
</script>

<div  class="rounded-container bg-glass p-1 md:p-2 {borderStyles} {shadowStyles} {styles}">
    {@render children?.()}
</div>
