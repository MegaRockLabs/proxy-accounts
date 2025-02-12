<script lang="ts">
    import Box from "./box.svelte";
    import { formatAddress } from "$lib/utils";
    import { appKit } from "$lib/appkit";
    import { wagmiAdapter, walletIcon } from "$lib/signers";
    import { selectedChain } from "$lib/chains";

    import { cosmosClient } from "$lib/clients";
    import { onEthAddressFound, onSolAddressFound } from "$lib";
    import { userAddress, foundAccountInfo } from "$lib/accounts";



    const onClick = () => {
        appKit.open();
    }

    const onConnectedClick = () => {
        appKit.open({ view: "Account" });
    }

    
    const onAddress = (address: string) => {

        const fai = $foundAccountInfo;

        if (address.startsWith('0x')) {
            if (fai?.credentials.some((c) => c.human_id === address)) {
                return;
            }
            onEthAddressFound($wagmiAdapter, $selectedChain.id, $cosmosClient, $userAddress);
        } else {
            onSolAddressFound($cosmosClient, $userAddress);
        }
    }

    $: if ($userAddress) onAddress($userAddress);

</script>

<Box>
    <div class="flex justify-center items-center min-h-8 gap-3 px-1 min-w-24">
        { #if $userAddress }
            <button class="flex flex-col text-sm" on:click={onConnectedClick}>
                <div class="flex-center gap-3 text-center px-1">
                    {#if $walletIcon}
                        <img src={$walletIcon} alt="wallet icon" class="w-4 h-4" />
                    {/if}
                    <span>{ formatAddress($userAddress) }</span>
                </div>
            </button>

        {:else }
            <button 
                class="flex text-sm font-bold text-center" 
                on:click={onClick}> Connect
            </button>
            
        {/if}
    </div>
</Box>
