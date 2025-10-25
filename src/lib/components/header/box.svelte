<script lang="ts">
  interface Props {
    styles?: string;
    children?: import('svelte').Snippet;
  }

  let { styles = "", children }: Props = $props();
</script>


<div class="rounded-container py-1 px-4 flex-center bg-glass-darker {styles}">
    {@render children?.()}
</div>