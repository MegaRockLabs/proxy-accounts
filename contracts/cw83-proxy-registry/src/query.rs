#![allow(unused)]

use cosmwasm_std::{Deps, Order, StdResult};

use crate::msg::{
        Account, AccountInfoResponse, AccountsResponse, CollectionAccount,
        CollectionAccountsResponse, CollectionsResponse,
    };

const DEFAULT_BATCH_SIZE: u32 = 100;

pub fn account_info(_: Deps) -> StdResult<AccountInfoResponse> {
    todo!()
    /* let address =
        TOKEN_ADDRESSES.load(deps.storage, (info.collection.as_str(), info.id.as_str()))?;
    Ok(AccountInfoResponse {
        address,
        info: None,
    }) */
}

