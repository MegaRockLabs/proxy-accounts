<script>
	import Web3State from './web3State.svelte';
  import Nav from "./nav.svelte";
</script>

<div class="flex justify-center px-5 md:px-12 my-4">
  <div class="w-full rounded-container-token bg-glass-dark flex items-center">

    <div class="flex flex-col md:flex-row items-end md:items-center w-full py-1">
      <div class="flex w-full flex-col md:flex-row items-center justify-between p-2 gap-y-4">
          <Nav />
          <Web3State />
      </div>
    </div>
  </div>
</div>
