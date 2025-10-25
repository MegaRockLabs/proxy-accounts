<script lang="ts">
    interface Props {
        styles?: string;
        onClick?: (_ : any) => void;
        disabled?: boolean;
        selected?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        styles = '',
        onClick = () => {},
        disabled = false,
        selected = false,
        children
    }: Props = $props();
    let selectedStyles = $derived(selected ? 'border-2' : '');
</script>

<button 
    onclick={onClick} 
    {disabled}
    class="btn rounded-container bg-glass bg-glass-shadow text-sm {selectedStyles} {styles}"
>
    {@render children?.()}
</button>