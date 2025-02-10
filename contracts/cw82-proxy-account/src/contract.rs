#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, StdError, StdResult
};
use cw_accs::{Response, SubMsg};
use saa::storage::ACCOUNT_NUMBER;


use crate::{
    action::execute_action, 
    error::ContractError, execute, 
    msg::{ContractResult, CredQueryMsg, ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg}, 
    query::{can_execute, credentials, full_info, valid_signature, valid_signatures}, 
    state::{save_credentials, REGISTRY_ADDRESS}
};

#[cfg(target_arch = "wasm32")]
use crate::utils::query_if_registry;

pub const CONTRACT_NAME: &str = "crates:cw82-proxy-account";
pub const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");



#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> ContractResult {
    cw2::set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    cw22::set_contract_supported_interface(
        deps.storage,
        &[
            cw22::ContractSupportedInterface {
                supported_interface: cw82::INTERFACE_NAME.into(),
                version: CONTRACT_VERSION.into(),
            },
            cw22::ContractSupportedInterface {
                supported_interface: "crates:cw81".into(),
                version: CONTRACT_VERSION.into(),
            },
            cw22::ContractSupportedInterface {
                supported_interface: "crates:cw1".into(),
                version: "1.1.1".into(),
            },
        ],
    )?;
    #[cfg(target_arch = "wasm32")]
    if !query_if_registry(&deps.querier, info.sender.clone())? {
        return Err(ContractError::Unauthorized {});
    };

    REGISTRY_ADDRESS.save(deps.storage, &info.sender.to_string())?;
    save_credentials(deps.api, deps.storage, &env, info.clone(), msg.account_data)?;

    let actions = msg.actions.unwrap_or_default();
    let mut msgs: Vec<SubMsg> = Vec::with_capacity(actions.len());
    
    let res = if actions.len() > 0 {
        let mut res = Response::new();
        for action in actions {
            let action_res = execute_action(&env, action)?;
            msgs.extend(action_res.messages);

            res = res.add_events(action_res.events)
                   .add_attributes(action_res.attributes);

           if res.data.is_none() && action_res.data.is_some() {
               res = res.set_data(action_res.data.unwrap());
           }
        }
       res
   } else {
       Response::default()
   };

   Ok(res.add_submessages(msgs))
}



#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> ContractResult {

    match msg {
        ExecuteMsg::Execute { 
            msgs 
        } => execute::try_executing(deps, env, info, msgs),

        ExecuteMsg::FeeGrant { 
            grantee, 
            allowance 
        } => execute::try_fee_granting(
            env.contract.address.as_str(), grantee.as_str(), allowance
        ),


        ExecuteMsg::UpdateAccountData {
            account_data,
            operation

        } => {
            execute::try_updating_account_data(deps, env, info, account_data, operation)
        }
        ExecuteMsg::Extension { .. } => Ok(Response::new())

    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    if REGISTRY_ADDRESS.load(deps.storage).is_err() {
        return Err(StdError::GenericErr {
            msg: ContractError::Deleted {}.to_string(),
        });
    };
    match msg {
        QueryMsg::AccountNumber {} => to_json_binary(&ACCOUNT_NUMBER.load(deps.storage)?),
        QueryMsg::Registry {} => to_json_binary(&REGISTRY_ADDRESS.load(deps.storage)?),
        QueryMsg::CanExecute { sender, msg } => {
            to_json_binary(&can_execute(deps, env, sender, msg)?)
        }
        QueryMsg::ValidSignature {
            signature,
            data,
            payload,
        } => to_json_binary(&valid_signature(deps, env, data, signature, payload)?),
        QueryMsg::ValidSignatures {
            signatures,
            data,
            payload,
        } => to_json_binary(&valid_signatures(deps, env, data, signatures, payload)?),
        
        QueryMsg::Extension { msg } => {
            match msg {
                CredQueryMsg::FullInfo {  } => to_json_binary(&full_info(deps, env)?),
                CredQueryMsg::Credentials {} => to_json_binary(&credentials(deps)?)
            }
        },
    }
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_: DepsMut, _: Env, _: MigrateMsg) -> ContractResult {
    Ok(Response::default())
}


