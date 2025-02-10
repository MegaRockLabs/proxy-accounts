use cosmwasm_std::{
    ensure, to_json_binary, BankMsg, Binary, Coin, CosmosMsg, DepsMut, Env, MessageInfo, ReplyOn, Response, SubMsg, WasmMsg
};

use cw83::CREATE_ACCOUNT_REPLY_ID;
use cw_accs::{ExecuteAccountMsg, InstantiateAccountMsg};
use saa::{messages::SignedDataMsg, CredentialData, CredentialsWrapper, UpdateOperation, Verifiable};


use crate::{
    error::ContractError, funds::checked_funds, registry::construct_label, state::{CreationCache, ACCOUNTS, ADMIN, CREATION_CACHE, CREDENTIALS, REGISTRY_PARAMS}
};

pub fn create_account(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    chain_id: String,
    code_id: u64,
    account_data: CredentialData,
    actions: Option<Vec<ExecuteAccountMsg>>,
) -> Result<Response, ContractError> {
    let params = REGISTRY_PARAMS.load(deps.storage)?;
    ensure!(env.block.chain_id == chain_id, ContractError::InvalidChainId {});
    ensure!(params.allowed_code_ids.contains(&code_id), ContractError::InvalidCodeId {});

    let msgs : Vec<CosmosMsg> = Vec::with_capacity(1);
    let funds = checked_funds(deps.storage, &info)?;
    let label = construct_label(None);

    
    let init_msg = InstantiateAccountMsg {
        account_data: account_data.clone(),
        actions,
    };

    CREATION_CACHE.save(deps.storage, &CreationCache {
        account_data,
    })?;

    
    Ok(Response::default()
        .add_messages(msgs)
        .add_submessage(SubMsg {
            id: CREATE_ACCOUNT_REPLY_ID,
            msg: cosmwasm_std::CosmosMsg::Wasm(WasmMsg::Instantiate {
                admin: Some(env.contract.address.to_string()),
                msg: to_json_binary(&init_msg)?,
                code_id,
                label,
                funds,
            }),
            reply_on: ReplyOn::Success,
            gas_limit: None,
        })
        .add_attributes(vec![
            ("action",  "create_account"),
            ("code_id", code_id.to_string().as_str()),
            ("chain_id", chain_id.as_str()),
        ])
    )
}




pub fn update_account_data(
    deps: DepsMut,
    _: Env,
    _: MessageInfo,
    account_data: CredentialData,
    operation: UpdateOperation
) -> Result<Response, ContractError> {
    account_data.validate()?;
    
    let primary_id = account_data.primary_id();
    let address = ACCOUNTS.load(deps.storage, primary_id.clone());
    ensure!(address.is_ok(), ContractError::NoAccounts {});

    match &operation {
        UpdateOperation::Add(cred) => {
            cred.credentials.iter().try_for_each(|cred| -> Result<(), ContractError> {
                let id = cred.id();
                ensure!(
                    !CREDENTIALS.has(deps.storage, id.clone()),
                    ContractError::AccountExists {}
                );
                CREDENTIALS.save(deps.storage, id.clone(), &primary_id)?;
                Ok(())
            })?;
        },
        UpdateOperation::Remove(cred) => {
            cred.credentials.iter().try_for_each(|cred| -> Result<(), ContractError> {
                let id = cred.id();
                ensure!(
                    CREDENTIALS.load(deps.storage, id.clone())? == primary_id,
                    ContractError::Unauthorized {}
                );
                CREDENTIALS.remove(deps.storage, id.clone());
                Ok(())
            })?;
        },
    }

    let msg : CosmosMsg = CosmosMsg::Wasm(WasmMsg::Execute {
        contract_addr: address?,
        msg: to_json_binary(&cw_accs::ExecuteAccountMsg::<SignedDataMsg, CredentialData>::UpdateAccountData { 
            account_data: Some(account_data),
            operation,
        })?,
        funds: vec![],
    });


    Ok(Response::new().add_message(msg))

}




pub fn forward(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    address: String,
    amount: Option<Vec<Coin>>,
    data: Option<Binary>
) -> Result<Response, ContractError> {
    if data.is_none() {
        ensure!(ADMIN.load(deps.storage)? == info.sender, ContractError::Unauthorized {});
        let amount = match amount {
            Some(amount) => amount,
            None => deps.querier.query_all_balances(env.contract.address)?
        };
        let msg : CosmosMsg = BankMsg::Send { to_address: address, amount }.into();
        Ok(Response::new().add_message(msg))
    } else {
        Err(ContractError::Std(cosmwasm_std::StdError::generic_err("not implemented")))
    }

}
  