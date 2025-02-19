<script lang="ts">
	import Container from '$lib/components/common/container.svelte';
  import Separator from '$lib/components/common/separator.svelte';
  import ElevatedBox from '$lib/components/common/elevatedBox.svelte';
  import DashHeader from '$lib/components/common/dashHeader.svelte';
  import ElevatedButtonBox from '$lib/components/common/elevatedButtonBox.svelte';

  import { getModalStore } from '@skeletonlabs/skeleton';
  import { foundAccountInfo, userAddress } from '$lib//accounts';
  import { accountBalances } from '$lib//assets';
  import { appKit } from '$lib/appkit';

  const modalStore = getModalStore();

  $: hasAccount = Boolean($foundAccountInfo);

  const createClick = () => {
    modalStore.trigger({
        type: 'component',
        component: "createAccount",
        backdropClasses: "backdrop-blur-xl",
    });
  }

  const deposit = () => {
    modalStore.trigger({
      type: 'component',
      component: "deposit",
      backdropClasses: "backdrop-blur-xl",
    });
  }

  const withdraw = () => {
    modalStore.trigger({
      type: 'component',
      component: "withdraw",
      backdropClasses: "backdrop-blur-xl",
    });
  }

  const connect = () => {
      appKit.open();
  }

  $: disabled = !$userAddress
  $: console.log("userAddress", $userAddress, !!$userAddress)

</script>


<Container styles="z-20 font-bold">

    
  
  { #if hasAccount  }

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

      { #if $userAddress }

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