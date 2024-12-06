
use crate::{
    action::execute_action, 
    msg::{ContractResult, SignedMessages}, 
    state::{REGISTRY_ADDRESS, WITH_CALLER}, 
    utils::{assert_caller, assert_registry
    }
};
use cosmwasm_std::{from_json, to_json_binary, Addr, CosmosMsg, DepsMut, Env, MessageInfo, Response};
use cw2::CONTRACT;
use cw22::SUPPORTED_INTERFACES;
use saa::{messages::SignedDataMsg, reset_credentials, storage::increment_account_number, CredentialData, UpdateOperation};

pub const MINT_REPLY_ID: u64 = 1;


pub fn try_executing(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msgs: Vec<CosmosMsg<SignedDataMsg>>,
) -> ContractResult {
    let mut res = Response::new();

    for msg in msgs {

        if let CosmosMsg::Custom(signed) = msg.clone() {

            saa::verify_signed_actions(
                deps.api,
                deps.storage, 
                &env,
                signed.clone()
            )?;

            let data : SignedMessages = from_json(&signed.data)?;

            for action in data.messages {
                let action_res = execute_action(action)?;
                res = res
                    .add_submessages(action_res.messages)
                    .add_events(action_res.events)
                    .add_attributes(action_res.attributes);
                if action_res.data.is_some() {
                    res = res.set_data(action_res.data.unwrap());
                }
            }
        } else {
            assert_caller(deps.as_ref(), info.sender.as_str())?;
            increment_account_number(deps.storage)?;
            let msg : CosmosMsg = from_json(to_json_binary(&msg)?)?;
            res = res.add_message(msg);
        }
    }
    Ok(res)
}



pub fn try_updating_account_data(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    data: Option<CredentialData>,
    op: UpdateOperation
) -> ContractResult {

    match data {
        Some(data) => {
            data.update_cosmwasm(op, deps.api, deps.storage, &env, &info)?;
        },
        None => {
            assert_caller(deps.as_ref(), info.sender.as_str())?;

            CredentialData {
                credentials: vec![],
                primary_index: None,
                with_caller: None
            }.update_cosmwasm(op, deps.api, deps.storage, &env, &info)?;
        }
    }

    Ok(Response::new().add_attributes(vec![("action", "update_account_data")]))
}




pub fn try_purging(deps: DepsMut, sender: Addr) -> ContractResult {
    assert_registry(deps.storage, sender.as_str())?;
    reset_credentials(deps.storage)?;

    cw_ownable::initialize_owner(deps.storage, deps.api, None)?;

    SUPPORTED_INTERFACES.clear(deps.storage);
    CONTRACT.remove(deps.storage);
    REGISTRY_ADDRESS.remove(deps.storage);
    WITH_CALLER.remove(deps.storage);

    Ok(Response::default().add_attribute("action", "purge"))
}