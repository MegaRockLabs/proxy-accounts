<script lang="ts">
	import '../app.postcss';
	import 'material-icons/iconfont/material-icons.css';
	
	import Header from '$lib/components/header/header.svelte';
	import { AppShell, getToastStore, Modal } from '@skeletonlabs/skeleton';
	import { bridgeTasks, onMountLogic } from '$lib';
	import { page } from '$app/stores';

	import { storePopup } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { initializeStores, Toast } from '@skeletonlabs/skeleton';

	
    import { onMount } from 'svelte';
    import { modalRegistry } from '$lib/components/modals/registry';
  	import { skipClient } from '$lib/clients';
  	import { processBridgeTasks } from '$lib/routes';
	  
	initializeStores();
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	
	const toastStore = getToastStore();

	let taskProcessed = false;
	
	onMount(() => {
		onMountLogic();
		console.log('bridgeTasks', $bridgeTasks);
	});

	$: if ($skipClient && $bridgeTasks && toastStore && !taskProcessed) {
		taskProcessed = true;
		processBridgeTasks($skipClient, $bridgeTasks, toastStore);
	}

</script>

<Modal zIndex='z-[999]' components={modalRegistry} />
<Toast zIndex='z-[1000]' 
	position='tr' 
	background="bg-glass" 
	buttonAction="btn variant-filled-primary"	
	buttonDismiss="btn btn-sm variant-filled-primary"
	spacing="flex gap-2 flex-col justify-center items-center"
/>


<AppShell class="transition- ease-in-out duration-500  bg-no-repeat bg-cover">
	
	<svelte:fragment slot="pageHeader">
		<!-- App Bar -->
		<Header />
	</svelte:fragment>
	<!-- Page Route Content -->

	
	<slot />

</AppShell>
