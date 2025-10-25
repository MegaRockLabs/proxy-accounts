<script lang="ts">
    interface Props {
        styles?: string;
        small?: boolean;
        onClick?: (_ : any) => void;
        disabled?: boolean;
        selected?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        styles = '',
        small = true,
        onClick = () => {},
        disabled = false,
        selected = false,
        children
    }: Props = $props();
    let selectedStyles = $derived(selected ? 'bg-glass-darker' : '');
</script>

<button 
    onclick={onClick} 
    {disabled}
    class="btn btn-lg font-bold bg-glass bg-glass-shadow rounded-container py-2 px-3 border border-white/20 {small ? "text-sm" : ""} {selectedStyles} {styles}"
>
    {@render children?.()}
</button>

