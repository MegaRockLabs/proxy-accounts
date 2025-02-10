<script lang="ts">
    export let active = false;
    export let text : string;
    export let href : string;

    const common = "rounded-token px-4 py-2 "
    $: classes = common + (active ? " bg-glass-darker" : "");
</script>

<a {href} class={classes}>
    {text}
</a>