<script lang="ts">
	import '../app.css';
	import 'material-icons/iconfont/material-icons.css';
	import Header from '$lib/components/header/header.svelte';
	import { bridgeTasks, onMountLogic } from '$lib';
	import { Toast, createToaster } from '@skeletonlabs/skeleton-svelte';

	
    import { onMount } from 'svelte';
  	import { skipClient } from '$lib/clients';
  	import { processBridgeTasks } from '$lib/routes';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	
	const toaster = createToaster({
		placement: 'top-end',
	});
	
	onMount(() => {
		onMountLogic()
		.then(() => {
			// console.log('onMountLogic done');
			console.log('bridgeTasks', $bridgeTasks);
			const tasks = $bridgeTasks;
			if (tasks) {
				processBridgeTasks($skipClient, tasks, toaster);
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


<!-- Toast Notifications -->
<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>


<!-- Main Layout -->
<div class="transition-ease-in-out duration-500 bg-no-repeat bg-cover bg-[url('/bg.jpg')] min-h-screen flex flex-col">
	
	<!-- Header -->
	<Header />
	
	<!-- Page Route Content -->
	<main class="flex-1">
		{@render children?.()}
	</main>

</div>

