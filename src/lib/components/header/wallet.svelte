<script lang="ts">
    import Box from "./box.svelte";
    import { formatAddress } from "$lib/utils";
    import { appKit } from "$lib/appkit";
    import { wagmiAdapter, walletIcon, walletName } from "$lib/signers";
    import { selectedChain } from "$lib/chains";

    import { cosmosClient } from "$lib/clients";
    import { onEthAddressFound, onSolAddressFound } from "$lib";
    import { userAddress, foundAccountInfo } from "$lib/accounts";

    let prevWalletName = $state<string | undefined>(undefined);
    let prevWalletIcon = $state<string | undefined>(undefined);
    let prevUserAddress = $state<string | undefined>(undefined);

    const updateIcon = (name: string, icon : string) => {
        if (!icon) {
            if (name) {
                // TODO: add more wallet icons
            }
        }
    }

    $effect(() => {
        console.log('Appkit:', appKit);

        const name = $walletName;
        const icon = $walletIcon;
        console.log('Wallet changed:', { name, icon });
        
        if (name && (name !== prevWalletName || icon !== prevWalletIcon)) {
            prevWalletName = name;
            prevWalletIcon = icon;
            updateIcon(name, icon);
        }
    });


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

    $effect(() => {
        const address = $userAddress;
        
        if (address && address !== prevUserAddress) {
            prevUserAddress = address;
            onAddress(address);
        }
    });

</script>

<Box>
    <div class="flex justify-center items-center min-h-8 gap-3 px-1 min-w-24">
        {#if $userAddress}
            <button class="flex flex-col text-sm" onclick={onConnectedClick}>
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
                onclick={onClick}> Connect
            </button>
            
        {/if}
    </div>
</Box>
