<script lang="ts">
    interface Props {
        styles?: string;
        children?: import('svelte').Snippet;
    }

    let { styles = "", children }: Props = $props();
</script>

<div class="rounded-container p-3 bg-glass-dark bg-glass-shadow {styles}">
    {@render children?.()}
</div>