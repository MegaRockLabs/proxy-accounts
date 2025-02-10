<script lang="ts">
	import '../app.postcss';
	import 'material-icons/iconfont/material-icons.css';
	
	import Header from '$lib/components/header/header.svelte';
	import { AppShell, Modal } from '@skeletonlabs/skeleton';
	import { bridgeTasks, onMountLogic } from '$lib';
	import { page } from '$app/stores';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { initializeStores, Toast } from '@skeletonlabs/skeleton';

	
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { modalRegistry } from '$lib/components/modals/registry';
	
	$: bgVariant =  "bg-magic";
	
	let regionPage : string = '';
	$: if (!browser || $page.route.id == '/') {
		regionPage = "no-scrollbar"
	} else {
	}
	

	initializeStores();
  	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	
	onMount(() => {
		onMountLogic();
		console.log('bridgeTasks', $bridgeTasks);
	});

</script>

<Toast zIndex='z-[1000]' position='tr' background="bg-glass" />
<Modal zIndex='z-[999]' components={modalRegistry} />


<AppShell {regionPage}  class="transition- ease-in-out duration-500 {bgVariant} bg-no-repeat bg-cover">
	
	<svelte:fragment slot="pageHeader">
		<!-- App Bar -->
		<Header />
	</svelte:fragment>
	<!-- Page Route Content -->

	
	<slot />

</AppShell>
