import type { AppKit, ConnectedWalletInfo, Provider, UseAppKitAccountReturn, UseAppKitNetworkReturn } from "@reown/appkit";
import { BASE_CAIP, getEthChain, selectedChain, Solana, SOLANA_CAIP } from "./chains";
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

import UniversalProvider from '@walletconnect/universal-provider';
import type { ChainNamespace } from "@reown/appkit-common";
import type { W3mFrameProvider } from "@reown/appkit-wallet";
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { LOGO_USDC, metadata, networks, projectId, SOLANA_ID } from "./vars";
import { BASE_USDC, SOLANA_USDC } from "./tokens";
import { setSolanaAdapter, setWagmiAdapter, setWallet, walletIcon, walletName } from "./signers";
import { writable } from "svelte/store";
import { debounce } from "./utils";


export type KitProvider = UniversalProvider 
    | Provider 
    | W3mFrameProvider 
    | undefined
    | unknown
    

export let appKit : AppKit;
export let eip155Provider : KitProvider;
export let solanaProvider : KitProvider;
export let universalProvider : UniversalProvider | undefined = undefined;

export const address = writable<string>();
export const connected = writable(false);


export const providerCallback = (provider: Record<ChainNamespace, KitProvider>) => {
    eip155Provider = provider.eip155;
    solanaProvider = provider.solana;
    
    if (!universalProvider) {
        const provider  = (eip155Provider ?? solanaProvider) as UniversalProvider;

        if (provider?.client?.protocol === "wc") {

            universalProvider = provider;

            universalProvider.on('session_request', async (event : any) => {
                console.log("session_request", event);
            })
        
            universalProvider.on('session_event', async (event : any) => {
                console.log("session_event", event);
            })
        
            universalProvider.on('session_update', async (event : any) => {
                console.log("session_update", event);
            })
        }
        
    }
}

export const accountCallback = (account: UseAppKitAccountReturn) => {
    connected.set(account.isConnected);
    address.set(account.address ?? "");
}

export const walletCallback = (wallet?: ConnectedWalletInfo) => {
    if (wallet) setWallet(wallet)
}


export const networkCallback = (network: Omit<UseAppKitNetworkReturn, 'switchNetwork'>) => {
    debounce(() => {
        const id = network.chainId;
        if (id) {
            if (id === SOLANA_ID) {
                selectedChain.set(Solana);
            } else {
                selectedChain.set(getEthChain(id.toString()))
            }
        }
    })
}


export const initAppKit = async () : Promise<AppKit> => {

    const wagmi = new WagmiAdapter({
        projectId,
        networks,
    })
    setWagmiAdapter(wagmi);

    const sol = new SolanaAdapter({
        wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
    })
    
    setSolanaAdapter(sol);

    const kit = createAppKit({
        projectId,
        metadata,
        networks,
        defaultNetwork: networks[0],
        adapters: [wagmi, sol],
        tokens: {
            [BASE_CAIP]: {
                address: BASE_USDC.denom,
                image: LOGO_USDC
            },
            [SOLANA_CAIP]: {
                address: SOLANA_USDC.denom,
                image: LOGO_USDC
            }
        },
        features: { 
            analytics: false,
            connectMethodsOrder: ['wallet', "social", "email"],
            socials: ["x", "github", "discord", "apple", "google"],
        }
    })

    kit.subscribeWalletInfo(walletCallback);
    kit.subscribeAccount(accountCallback);
    kit.subscribeNetwork(networkCallback);
    kit.subscribeProviders(providerCallback);
    console.log("kit", kit);

    
    appKit = kit;

 
    /* 
    console.log("provider", provider, provider?.isWalletConnect);

    provider.on('session_request', async (event : any) => {
        console.log("session_request", event);
    })

    provider.on('session_event', async (event : any) => {
        console.log("session_event", event);
    })

    provider.on('session_update', async (event : any) => {
        console.log("session_update", event);
    }) */


    return kit;
}


