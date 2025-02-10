<script lang="ts">
	import Link from './link.svelte';
    import { page } from '$app/stores';
    import { base } from '$app/paths';


    const routes = [
        { href: '/', text: 'Dashboard' },
       // { href: '/app', text: 'App' }
    ];

</script>

<nav class="flex-center gap-2 md:gap-4  mx-0 md:mx-5 text-sm md:text-base">
    {#each routes as { href, text }, i (i) }
        <Link href={base + href} {text} active={$page.route.id === href} />
    { /each }
</nav>