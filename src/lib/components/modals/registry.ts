import CreateAccount from "./createAccount.svelte";
//import Deposit from "./deposit.svelte";
//import Withdraw from "./withdraw.svelte";

export const modalRegistry: Record<string, any> = {
	createAccount	: { ref: CreateAccount },
//	deposit   		: { ref: Deposit },
//	withdraw		: { ref: Withdraw },
};