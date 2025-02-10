#![allow(unused)]

use cosmwasm_std::{ensure, Deps, Order, StdError, StdResult, Storage};
use cw83::AccountQuery;

use crate::{msg::{
        Account, AccountInfoResponse, AccountsResponse, CredentialQuery
    }, state::{ACCOUNTS, CREDENTIALS}};

const DEFAULT_BATCH_SIZE: u32 = 100;


fn get_account(
    storage: &dyn Storage,
    query: CredentialQuery
) -> StdResult<String> {
    let account = match query {
        CredentialQuery::One(cred_id) => {
            let main_cred = CREDENTIALS.load(storage, cred_id.to_vec())?;
            ACCOUNTS.load(storage, main_cred)
        },
        
        CredentialQuery::Many(cred_ids) => {
            ensure!(cred_ids.len() > 0, StdError::not_found("No account found for the given credential id"));
            let first_id = cred_ids.first().unwrap();
            let first_cred = CREDENTIALS.load(storage, first_id.to_vec());
            ensure!(first_cred.is_ok(), StdError::not_found("No account found for the given credential id"));
            let first = first_cred.unwrap();
            
            let account = ACCOUNTS.load(storage, first.clone()).unwrap_or_default();
            cred_ids.iter().skip(1).try_for_each(|cred_id| {
                let cred = CREDENTIALS.load(storage, cred_id.to_vec()).unwrap();
                ensure!(&cred == &first, StdError::not_found("No account found for the given credential id"));
                Ok::<(), StdError>(())
            });
            ACCOUNTS.load(storage, first)
        }
    };
    ensure!(account.is_ok(), StdError::not_found("No account found for the given credential id"));
    Ok(account?)
}



pub fn account_info(
    deps: Deps,
    query: CredentialQuery
) -> StdResult<AccountInfoResponse> {

    Ok(AccountInfoResponse {
        address: get_account(deps.storage, query)?,
        info: None,
    })
}


