#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    ensure, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Reply, Response, StdResult
};

use cw82::Cw82Contract;
use cw83::CREATE_ACCOUNT_REPLY_ID;
use saa::{CredentialsWrapper, Verifiable};

use crate::{
    error::ContractError,
    execute::{create_account, update_account_data},
    msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg},
    query::account_info,
    state::{ACCOUNTS, CREATION_CACHE, CREDENTIALS, REGISTRY_PARAMS},
};

pub const CONTRACT_NAME: &str = "crates:cw83-proxy-registry";
pub const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _: Env,
    _: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    cw2::set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    cw22::set_contract_supported_interface(
        deps.storage,
        &[cw22::ContractSupportedInterface {
            supported_interface: cw83::INTERFACE_NAME.into(),
            version: CONTRACT_VERSION.into(),
        }],
    )?;
    REGISTRY_PARAMS.save(deps.storage, &msg.params)?;
    Ok(Response::new().add_attributes(vec![("action", "instantiate")]))
}



#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    ensure!(CREATION_CACHE.may_load(deps.storage)?.is_none(), ContractError::Unauthorized {});

    match msg {
        ExecuteMsg::CreateAccount(create) => create_account(
            deps,
            env,
            info,
            create.chain_id,
            create.code_id,
            create.msg.account_data,
            create.msg.actions,
        ),
        ExecuteMsg::UpdateAccountData { 
            account_data, 
            operation 
        } => update_account_data(deps, env, info, account_data, operation)

    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn reply(deps: DepsMut, _: Env, msg: Reply) -> Result<Response, ContractError> {
    if msg.id == CREATE_ACCOUNT_REPLY_ID {
        let res = cw_utils::parse_reply_instantiate_data(msg)?;

        let addr = res.contract_address;
        let ver_addr = deps.api.addr_validate(addr.as_str())?;

        let data = CREATION_CACHE.load(deps.storage)?.account_data;
        
        let primary = &data.primary_id();

        ACCOUNTS.save(deps.storage, primary.clone(), &addr)?;
        CREATION_CACHE.remove(deps.storage);
        
        data.credentials
            .iter()
            .try_for_each(|cred| -> Result<(), ContractError> {
                let id = cred.id();
                ensure!(
                    !CREDENTIALS.has(deps.storage, id.clone()),
                    ContractError::AccountExists {}
                );
                CREDENTIALS.save(deps.storage, id.clone(), primary)?;
                Ok(())
        })?;

        Cw82Contract(ver_addr).supports_interface(&deps.querier)?;
        Ok(Response::default())
    } else {
        Err(ContractError::Unauthorized {})
    }
}



#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::AccountInfo(
            query
        ) => to_json_binary(&account_info(deps, query.query)?),

        QueryMsg::RegistryParams {} => to_json_binary(&REGISTRY_PARAMS.load(deps.storage)?),
    }
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn migrate(_: DepsMut, _: Env, _: MigrateMsg) -> StdResult<Response> {
    Ok(Response::default().add_attribute("action", "migrate"))
}
