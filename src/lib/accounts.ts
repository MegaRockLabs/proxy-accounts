
import type { Coin } from "@keplr-wallet/types";
/* import { getEthPersonalSignCredential, getPasskeyCredential } from "smart-account-auth"; */
import { fromBase64, fromHex, fromUtf8, toBase64, toUtf8 } from "@cosmjs/encoding";
import { accountBalances, coinsToBalances } from "./assets";
import { get, writable } from "svelte/store";
import type { AccountAction, CosmosClient, FullInfo, ParsedAccountInfo } from "./types";
import { getAccountInfo } from "./registry";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { NEUTRON_ACCOUNT_ID, NEUTRON_ID, NEUTRON_REGISTRY } from "./vars";
import { coins, type StdFee } from "@cosmjs/stargate";
import type { CredentialData } from "smart-account-auth";
import { toBinary, type MsgExecuteContractEncodeObject, type SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { getEVMSigner, relayingAddress } from "./signers";
import { updateFeeGrants } from "./cosmos";



export const foundAccountInfo = localStorageStore<ParsedAccountInfo | undefined>("foundAccountInfo", undefined);


export const userAddress = writable<string>();



export const getAccountFullInfo = async (
    client: CosmosClient,
    address: string,
) : Promise<FullInfo> => {

    return await client.wasm.queryContractSmart(
        address,
        { extension: { msg: { full_info: {} } } }
    )
}




export const updateAccounts = async (
    client: CosmosClient,
    credentialId: string | string[]
) => {

    const ids = typeof credentialId == "string" ? [credentialId] : credentialId;

    for (const id of ids) {
        const res = await getAccountInfo(client, id)
        // console.log(id, " account info", res);
        if (res && res.address) {
            updateAccountInfo(client, res.address);
            updateFeeGrants(
                client, 
                get(relayingAddress),
                res.address
            );
            break;
        }
    }

}


export const updateAccountInfo = (client: CosmosClient, address: string) => {

    getAccountFullInfo(client, address)
    .then(res => {
        const info : any = {
            native_caller: res.credentials?.native_caller || false,
            address
        }
        coinsToBalances(res.balances).then(balances => accountBalances.set(balances));
        if (res.credentials) {

            info.credentials = res.credentials.credentials.map(([id, cred]) => {
                const name = cred.name;
                let human_id = id;
                if (name == "passkey" && id.length > 28) {
                    human_id = fromUtf8(fromBase64(id));
                }  else if (name == "eth_personal_sign" && !id.startsWith("0x")) {
                    human_id  =  new TextDecoder('utf-8').decode(fromBase64(id))
                }
                return { ...cred, id, human_id }
            });

            const found = res.credentials.credentials
                    .find(([id, _]) => res.credentials!.verifying_id == id );

            if (found) {
                info.verifying  = found[1];
            }
            
        }
        foundAccountInfo.set(info)
    })
    .catch(console.error);
}

    




export const createAccount = async (
    client: SigningCosmWasmClient,
    signer: string,
    feeCoin: Coin,
    account_data: CredentialData,
    msgOnly: boolean = false
) => {

    const actions : AccountAction[] = [
        {
            fee_grant: {
                grantee: signer,
                allowance: {
                    spend_limit: [ { amount: "5000000", denom: feeCoin.denom } ],
                }
            }
        }
    ];
    

    const msg = {
        create_account: {
            code_id: NEUTRON_ACCOUNT_ID,
            chain_id: NEUTRON_ID,
            msg: { 
                account_data: account_data,
                actions
            }
        }
    }

    if (msgOnly) return msg;
    

    const res = await client.execute(
        signer,
        NEUTRON_REGISTRY,
        msg,
        'auto',
        "",
        coins(
            100000 + Number(feeCoin.amount),
            feeCoin.denom
        )
    )

    console.log("create proxy account res", res);

    const event = res.events.find(e => e.type === "instantiate")!;
    const address = event.attributes.find(a => a.key === "_contract_address")!.value;
    return address;
}





export const executeAccount = async (
    client          : SigningCosmWasmClient,
    signerAddress   : string,
    accountAddress  : string,
    messages        : AccountAction[],
    funds           : Coin[],
    memo            : string = ""
) => {

    const msgs : MsgExecuteContractEncodeObject[] = messages.map(msg => ({
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
            contract: accountAddress,
            msg: toUtf8(JSON.stringify(msg)),
            sender: signerAddress,
            funds
        })
    }));

    let fee : StdFee | "auto" = "auto";
/*     const gasAdjustment = 2.1;

    if (get(activeFeeGrants)
        .find(fg => fg.granter == accountAddress && fg.grantee == signerAddress)
            !== undefined
    ) {
        const amount = await client.simulate(signerAddress, msgs, memo);
        const gas = Math.round(amount * gasAdjustment);

        fee = {
            ...calculateFee(gas, gasPrice),
            granter: accountAddress,
            payer: signerAddress,
        };
    }
 */
    const result = await client.signAndBroadcast(
        signerAddress,
        msgs,
        fee,
        memo,
    )

    return result;
}



export const executeAccountActions = async (
    signingClient   : SigningCosmWasmClient,
    signerAddress   : string,
    accountInfo     : ParsedAccountInfo,
    messages        : AccountAction[],
    memo            : string = "",
    msgOnly: boolean = false
) => {

    const contract = accountInfo.address;

    const nonce : string = await signingClient.queryContractSmart(contract, { account_number: {} });

    let data : any = {
        chain_id: NEUTRON_ID,
        contract_address: contract,
        messages,
        nonce
    }

    const evmSigner = await getEVMSigner("");

    const account = evmSigner.account!;

    const signature = await evmSigner.signMessage({
        account,
        message: JSON.stringify(data),
    })

    const sigBytes = fromHex(signature.slice(2));
    
    const custom : any = {
        data: toBinary(data),
        signature: toBase64(sigBytes)
    }

    const execute : any = { execute: { msgs: [{ custom }] } };

    console.log("execute", execute);
    
    if (msgOnly) {
        const msg : MsgExecuteContractEncodeObject = {
            typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
            value: MsgExecuteContract.fromPartial({
                contract,
                msg: execute,
                sender: signerAddress,
                funds: []
            })
        }
        return msg;
    }
    return await executeAccount(signingClient, signerAddress, accountInfo.address, [execute], [], memo);
}



/* 
export const executeAccount = async (
    client          : SigningClient,
    signerAddress   : string,
    accountAddress  : string,
    messages        : ExecuteAccountMsg[],
    funds           : Coin[],
    chainId         : string,
    memo            : string = ""
) => {

    const info = Neutron;
    const gasAdjustment = 2.1;

    const msgs : MsgExecuteContractEncodeObject[] = messages.map(msg => ({
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
            contract: accountAddress,
            msg: toUtf8(JSON.stringify(msg)),
            sender: signerAddress,
            funds
        })
    }));

    let fee : StdFee | "auto" = "auto";

    if (get(activeFeeGrants)
        .find(fg => fg.granter == accountAddress && fg.grantee == signerAddress)
            !== undefined
    ) {
        const amount = await client.simulate(signerAddress, msgs, memo);
        const gas = Math.round(amount * gasAdjustment);

        fee = {
            ...calculateFee(gas, info.gasPrice),
            granter: accountAddress,
            payer: signerAddress,
        };
    }

    const result = await client.signAndBroadcast(
        signerAddress,
        msgs,
        fee,
        memo,
    )



    return result;
}



export const executeAccountActions = async (
    signingClient   : SigningClient,
    signingWallet   : AppWallet,
    state           : AppState,
    accountAddress  : string,
    accountInfo     : AccountInfo | undefined | any,
    messages        : AccountAction[],
    funds           : Coin[] = [],
    wallets         : AppWallet[] = [],
    memo            : string = "",
) => {


    const address = state.lastAddress;
    const chain_id = state.lastChainId;
    const signerAddress = signingWallet.address;

    
    if (false && signerAddress === address) {

        console.log("native caller", accountInfo);
        console.log("messages", messages);

        return executeAccount(
            signingClient, 
            signingWallet.address, 
            accountAddress, 
            messages, 
            funds, 
            chain_id, 
            memo
        );

    } else {

        const nonce : string = await signingClient.queryContractSmart(accountAddress, { account_number: {} });
            
        let data : any = {
            chain_id,
            contract_address: accountAddress,
            messages,
            nonce
        }
        
        console.log("accountInfo", accountInfo);
        const verifying = accountInfo?.verifying;
        if (!verifying) {
            throw new Error("Native account is not created and no no custom ids on the account");
        }

        let signature : string = "", extension : string | undefined = undefined;

        if (verifying.name === "eth_personal_sign") {
            const ethAddress  =  accountInfo.verifying!.human_id!;
            const ethWallets = wallets.filter(wallet => wallet.isEthereum);
            const found = ethWallets.find(wallet => wallet.hasAccount({ address: ethAddress }));
            
            if (!found) {
                let text : string = "Couldn't find Ethereum wallet for address: " + ethAddress + "\n";
                if (ethWallets.length > 0) {
                    text +=  ethWallets.reduce(
                        (acc, wallet) => acc + wallet.accounts.map(a => a.address).join(", "),
                        "Available addresses:"
                    )
                }
                throw new Error(text);
            }

            // @ts-ignore
            const cred = { signature: "" } //(await getEthPersonalSignCredential(window.ethereum!, JSON.stringify(data), ethAddress)).eth_personal_sign;
            
            data = toBinary(data);
            signature = cred.signature

        } else if (verifying.name === "passkey") {
            
            //const id = new TextDecoder().decode(new Uint8Array(verifying.id!));

            let id = verifying.human_id;
            const str = JSON.stringify(data);
            console.log("JSON data:", str);
     
            const text = JSON.stringify(data);
            const utf = toUtf8(text);
            const base64 = toBase64(utf);
   
            
            // @ts-ignore
            const cred = { signature: "", authenticator_data: {}, client_data: { challenge: ""} } //(await getPasskeyCredential(JSON.stringify(data), id)).passkey
            signature = cred.signature;

            const passkeyExtension : any = {
                authenticator_data: cred.authenticator_data,
                // client_data: cred.client_data,
            }

            console.log("Passkey cred:", cred);
            console.log("Passkey extension:", passkeyExtension);

            data = cred.client_data.challenge; // toBinary("c3RhcnN2YWxvcGVyMXE0OHZ5enp6ODJraDlzbjJ6c3NsbmEzbWh1ang3MHM3eWc1anpm")
            extension = toBinary(passkeyExtension)

        } else {
            throw new Error("Account is controlled by a credential that is not supported by this app");
        }
    
        const custom : SignedAccountActions = {
            data,
            signature
        };
        
        if (extension) {
            custom.payload = {
                extension
            };
        }

        const execute : ExecuteAccountMsg = { execute: { msgs: [{ custom }] } };
        return executeAccount(signingClient, signerAddress, accountAddress, [execute], funds, chain_id, memo);
    }

}

 */