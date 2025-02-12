import { Secp256k1HdWallet } from "@cosmjs/amino";
import { get, writable } from "svelte/store";

import { PUBLIC_RELAYING_MNEMONIC } from "$env/static/public";
import { prefix } from "$lib/chains";
import { getWalletClient } from "@wagmi/core";

import type{ Adapter } from '@solana/wallet-adapter-base';
import { type WalletClient } from "viem";
import type { ConnectedWalletInfo } from "@reown/appkit";
import type { OfflineAminoSigner } from "@keplr-wallet/types";
import type { SolanaAdapter } from '@reown/appkit-adapter-solana'
import type { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { universalProvider } from "./appkit";
import { BASE_ID, SOLANA_ID } from "./vars";

export const relayingAddress = writable<string>();
export const relayingSigner = writable<Secp256k1HdWallet>();

export const wagmiAdapter = writable<WagmiAdapter>();
export const solanaAdapter = writable<SolanaAdapter>();

export const walletIcon = writable<string>();
export const walletName = writable<string>();


export let wagmiValue : WagmiAdapter | null = null;
let cosmosAdapter : Secp256k1HdWallet | null = null;
let solanaValue : SolanaAdapter | null = null;
let walletValue : string | null = null;


export const setWagmiAdapter = (adapter: WagmiAdapter) => {
    wagmiValue = adapter;
    wagmiAdapter.set(adapter);
}

export const setSolanaAdapter = (adapter: SolanaAdapter) => {
    solanaValue = adapter;
    solanaAdapter.set(adapter);
}

export const setWallet = (wallet?: ConnectedWalletInfo) => {
    const name = wallet?.name ?? "";
    const icon = wallet?.icon ?? "";
    walletValue = name;
    walletName.set(name);
    walletIcon.set(icon);
}


export const getWagmiConnector = async (
    wagmi: WagmiAdapter = wagmiValue ?? get(wagmiAdapter),
    wallet: string = walletValue ?? get(walletName)
) => {
    const conns = wagmi.wagmiConfig.connectors;
    const connector = wallet ? conns.find(c => c.id == wallet || c.name == wallet)! : conns[0];
    return connector;
}

export const getWagmiAddress = async (
    wagmi: WagmiAdapter = wagmiValue ?? get(wagmiAdapter),
    wallet: string = walletValue ?? get(walletName)
) : Promise<string> => {
    const connector = await getWagmiConnector(wagmi, wallet);
    const accounts = await connector.getAccounts();
    return accounts[0];
}


export const getCosmosSigner = async (_chainId: string) : Promise<OfflineAminoSigner> => {
    const signer = cosmosAdapter 
        ? cosmosAdapter 
        : (await Secp256k1HdWallet.fromMnemonic(PUBLIC_RELAYING_MNEMONIC, { prefix } ))

    return signer;
}


export const getEVMSigner = async (chainId: string = BASE_ID) : Promise<WalletClient>  => {
    const wagmi = wagmiValue ?? get(wagmiAdapter);
    const config = wagmi.wagmiConfig;
    const connector = await getWagmiConnector(wagmi);

    if (!connector && universalProvider) {
        const accs = await universalProvider.enable();
        const first = accs[0];
        return await getWalletClient(config, {
            chainId: Number(chainId),
            account: first as `0x${string}`,
        });
    }

    const isAuthorized = await connector.isAuthorized();
    
    const accounts = isAuthorized
        ? (await connector.getAccounts())
        : (await connector.connect({ chainId: Number(chainId) })).accounts

    return await getWalletClient(config, { 
        connector,
        chainId: Number(chainId),
        account: accounts[0] as `0x${string}`
    });
}


export const getSVMSigner = async ()  : Promise<Adapter> => {
    const solana = solanaValue ?? get(solanaAdapter);
    if (!solana.wallets) throw new Error("No wallets available");
    const provider = solana.wallets![0];
    if (!provider.connected) await provider.connect();
    return  provider;
}