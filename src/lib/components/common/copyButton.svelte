<script lang="ts">
    import { run } from 'svelte/legacy';
    import { formatAddress } from '$lib/utils';

    interface Props {
        address?: string;
    }

    let { address = '' }: Props = $props();

    let justClicked = $state(false);

    run(() => {
        if (justClicked) {
            setTimeout(() => justClicked = false, 1000);
        }
    });
</script>

<button 
    oncopyComplete={() => justClicked = true} 
    use:clipboard={address} 
    class="btn rounded-base bg-glass-darker py-1 px-2 md:py-2 md:px-3 text-xs md:text-sm flex justify-between items-center gap-1 md:gap-3"
>
    <span>{formatAddress(address)}</span>
    <span class="material-icons-round transition ease-out delay-0 duration-300" class:text-green-500={justClicked}>
        content_copy
    </span>
</button>
