use cosmwasm_schema::serde::Serialize;
use cosmwasm_std::{
    ensure, to_json_binary, Addr, CosmosMsg, DepsMut, Env, MessageInfo, ReplyOn, Response, SubMsg, WasmMsg
};

use cw83::CREATE_ACCOUNT_REPLY_ID;
use cw_accs::{
    InstantiateAccountMsg, MigrateAccountMsg
};
use saa::CredentialData;


use crate::{
    error::ContractError, funds::checked_funds, registry::construct_label, state::{CreationCache, CREATION_CACHE, REGISTRY_PARAMS}
};

pub fn create_account<A: Serialize>(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    chain_id: String,
    code_id: u64,
    account_data: CredentialData,
    actions: Option<Vec<A>>,
) -> Result<Response, ContractError> {
    let params = REGISTRY_PARAMS.load(deps.storage)?;
    
    ensure!(CREATION_CACHE.may_load(deps.storage)?.is_none(), ContractError::Unauthorized {});
    ensure!(env.block.chain_id == chain_id, ContractError::InvalidChainId {});
    ensure!(params.allowed_code_ids.contains(&code_id), ContractError::InvalidCodeId {});

    let msgs : Vec<CosmosMsg> = Vec::with_capacity(1);
    let funds = checked_funds(deps.storage, &info)?;
    let label = construct_label(None);

    let init_msg = InstantiateAccountMsg::<A, CredentialData> {
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



pub fn migrate_account(
    deps: DepsMut,
    _sender: Addr,
    new_code_id: u64,
    msg: MigrateAccountMsg,
) -> Result<Response, ContractError> {
    if !REGISTRY_PARAMS
        .load(deps.storage)?
        .allowed_code_ids
        .contains(&new_code_id)
    {
        return Err(ContractError::InvalidCodeId {});
    }
 
    let msg = CosmosMsg::Wasm(WasmMsg::Migrate {
        contract_addr: "todo".to_string(),
        new_code_id,
        msg: to_json_binary(&msg)?,
    });
    Ok(Response::default().add_message(msg).add_attributes(vec![
        ("action", "migrate_account"),
        ("new_code_id", new_code_id.to_string().as_str()),
    ]))
}
