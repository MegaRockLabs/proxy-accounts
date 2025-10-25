<script lang="ts">
    interface Props {
        active?: boolean;
        text: string;
        href: string;
    }

    let { active = false, text, href }: Props = $props();

    const common = "rounded-base px-4 py-2 "
    let classes = $derived(common + (active ? " bg-glass-darker" : ""));
</script>

<a {href} class={classes}>
    {text}
</a>