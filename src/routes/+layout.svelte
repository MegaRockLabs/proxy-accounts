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

	
	onMount(() => {
		onMountLogic()
		.then(() => {
			// console.log('onMountLogic done');
			console.log('bridgeTasks', $bridgeTasks);
			const tasks = $bridgeTasks;
			if (tasks) {
				processBridgeTasks($skipClient, tasks, toastStore);
			};
		});
	});


</script>


<svelte:head>
	<title>Proxy Accounts</title>
	<meta name="description" content="Proxy Accounts | by MegaRock" />
	<link rel="canonical" href="https://megarock.app/proxy" />
	<link rel="alternate" media="only screen and (max-width: 640px)"  href="https://megarock.app/proxy">


</svelte:head>


<Modal zIndex='z-[999]' components={modalRegistry} />
<Toast zIndex='z-[1000]' 
	position='tr' 
	background="bg-glass" 
	buttonAction="btn variant-filled-primary"	
	buttonDismiss="btn btn-sm variant-filled-primary"
	spacing="flex gap-2 flex-col justify-center items-center"
/>


<AppShell class="transition- ease-in-out duration-500  bg-no-repeat bg-cover bg-magic">
	
	<svelte:fragment slot="pageHeader">
		<!-- App Bar -->
		<Header />
	</svelte:fragment>
	<!-- Page Route Content -->

	
	<slot />

</AppShell>
