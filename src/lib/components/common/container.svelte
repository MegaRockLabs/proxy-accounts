<script lang="ts">
    interface Props {
        styles?: string;
        children?: import('svelte').Snippet;
    }

    let { styles = "", children }: Props = $props();
</script>

<div class="flex flex-col w-full md:w-2/3 lg:w-1/2 px-5 md:px-12 h-full mx-auto {styles}">
    {@render children?.()}
</div>
