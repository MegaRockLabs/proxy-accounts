<script lang="ts">
  import { run } from 'svelte/legacy';

	import Container from '$lib/components/common/container.svelte';
  import Separator from '$lib/components/common/separator.svelte';
  import ElevatedBox from '$lib/components/common/elevatedBox.svelte';
  import DashHeader from '$lib/components/common/dashHeader.svelte';
  import ElevatedButtonBox from '$lib/components/common/elevatedButtonBox.svelte';
  import { foundAccountInfo, userAddress } from '$lib//accounts';
  import { accountBalances } from '$lib//assets';
  import { appKit } from '$lib/appkit';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import CreateAccount from '$lib/components/modals/createAccount.svelte';
  import Deposit from '$lib/components/modals/deposit.svelte';
  import Withdraw from '$lib/components/modals/withdraw.svelte';

  // Dialog state management
  let showCreateAccount = $state(false);
  let showDeposit = $state(false);
  let showWithdraw = $state(false);

  let hasAccount = $derived(Boolean($foundAccountInfo));

  const createClick = () => {
    showCreateAccount = true;
  }

  const deposit = () => {
    showDeposit = true;
  }

  const withdraw = () => {
    showWithdraw = true;
  }

  const connect = () => {
      appKit.open();
  }

  let disabled = $derived(!$userAddress)
  run(() => {
    console.log("userAddress", $userAddress, !!$userAddress)
  });

</script>


<Container styles="z-20 font-bold">

    
  
  {#if hasAccount}

    <DashHeader />

    <Separator />

    <div class="flex flex-col gap-5 font-bold">
        {#each $accountBalances as bal}
          <ElevatedBox>
            <div class="flex w-full justify-between items-center  gap-3 py-3 px-5">
                <div class="flex gap-4 items-center">
                  <img src={bal.token.meta.logo} alt="logo" class="w-8 h-8" />
                  <div class="flex flex-col gap-2">
                    <span class="text-md">{bal.token.symbol}</span>
                    <span class="text-sm text-zinc-300">{bal.token.fullName}</span>
                  </div>
                </div>
                <div>
                  <div class="flex flex-col gap-2 items-end text-,d">
                    <span>{bal.amountHuman}</span>
                    <span class="text-sm text-zinc-300">${bal.amountUsd}</span>
                  </div>
                </div>
            </div>
          </ElevatedBox>
        {/each}
    </div>

        
    <div class="flex w-full justify-end gap-5 mt-5">
      <ElevatedButtonBox onClick={deposit} small={false} {disabled}>
        Deposit
      </ElevatedButtonBox>

      <ElevatedButtonBox onClick={withdraw} small={false} {disabled}>
        Withdraw
      </ElevatedButtonBox>
    </div>
    
        
  { :else }

    <DashHeader header={"No Accounts"} />
    <Separator />


    <div class="flex w-full justify-center">

      {#if $userAddress}

        <ElevatedButtonBox styles="col-span-2" small={false} onClick={createClick} {disabled}>
            Create New
        </ElevatedButtonBox>

      { :else }

        <ElevatedButtonBox styles="col-span-2" small={false} onClick={connect}>
            Connect Wallet
        </ElevatedButtonBox>
      {/if}
    </div>

  {/if}


  <Separator size={5} />




</Container>

<!-- Create Account Dialog -->
<Dialog open={showCreateAccount} onOpenChange={(e) => showCreateAccount = e.open}>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 backdrop-blur-xl bg-surface-50-950/50" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center">
      <Dialog.Content class="card bg-surface-100-900 w-full max-w-2xl p-6 space-y-4 shadow-xl">
        <CreateAccount />
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>

<!-- Deposit Dialog -->
<Dialog open={showDeposit} onOpenChange={(e) => showDeposit = e.open}>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 backdrop-blur-xl bg-surface-50-950/50" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center">
      <Dialog.Content class="card bg-surface-100-900 w-full max-w-2xl p-6 space-y-4 shadow-xl">
        <Deposit />
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>

<!-- Withdraw Dialog -->
<Dialog open={showWithdraw} onOpenChange={(e) => showWithdraw = e.open}>
  <Portal>
    <Dialog.Backdrop class="fixed inset-0 z-50 backdrop-blur-xl bg-surface-50-950/50" />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center">
      <Dialog.Content class="card bg-surface-100-900 w-full max-w-2xl p-6 space-y-4 shadow-xl">
        <Withdraw />
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>