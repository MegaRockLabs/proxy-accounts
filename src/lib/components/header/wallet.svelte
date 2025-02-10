<script lang="ts">
    import Box from "./box.svelte";
    import { formatAddress } from "$lib/utils";
    import { appKit, address } from "$lib/appkit";
    import { wagmiAdapter, walletIcon } from "$lib/signers";
    import { selectedChain } from "$lib/chains";

    import { PublicKey } from '@solana/web3.js';
    import { cosmosClient, getEthClient, solanaClient } from "$lib/clients";
    import { SOLANA_USDC } from "$lib/tokens";
    import { onEthAddressFound, onSolAddressFound } from "$lib";
    import { foundAccount, foundAccountInfo } from "$lib/accounts";


    const connectCheck = async () => {
        const wagmi = $wagmiAdapter;
        if (!wagmi) return;
    }
   

    const onClick = () => {
        appKit.open();
    }

    const onConnectedClick = () => {
        connectCheck();
        appKit.open({ view: "Account" });
    }

    const onAddress = (address: string) => {

        const fai = $foundAccountInfo;

        if (address.startsWith('0x')) {
            if (fai?.credentials.some((c) => c.human_id === address)) {
                return;
            }
            onEthAddressFound($wagmiAdapter, $selectedChain.id, $cosmosClient, $address);
        } else {
            onSolAddressFound($cosmosClient, $address);
        }

    }

    $: if ($foundAccountInfo) console.log("fai", $foundAccountInfo);

    $: if ($address) onAddress($address);

</script>

<Box>
    <div class="flex justify-center items-center min-h-8 gap-3 px-1 min-w-24">
        { #if $address }
            <button class="flex flex-col text-sm" on:click={onConnectedClick}>
                <div class="flex-center gap-3 text-center px-1">
                    {#if $walletIcon}
                        <img src={$walletIcon} alt="wallet icon" class="w-4 h-4" />
                    {/if}
                    <span>{ formatAddress($address) }</span>
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
