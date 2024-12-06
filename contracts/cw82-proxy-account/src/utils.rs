use cosmwasm_std::{ensure, Deps, Storage};
use cw_ownable::is_owner;


use crate::{
    error::ContractError,
    state::{
        REGISTRY_ADDRESS, WITH_CALLER
    },
};




#[cfg(target_arch = "wasm32")]
pub fn query_if_registry(querier: &cosmwasm_std::QuerierWrapper, addr: cosmwasm_std::Addr) -> cosmwasm_std::StdResult<bool> {
    let key = cosmwasm_std::storage_keys::namespace_with_key(
        &[cw22::INTERFACE_NAMESPACE.as_bytes()], 
        "crates:cw83".as_bytes()
    );
    let raw_query = cosmwasm_std::WasmQuery::Raw { 
        contract_addr: addr.to_string(),
        key: key.into()
    };
    let version : Option<String> = querier.query(&cosmwasm_std::QueryRequest::Wasm(raw_query))?;
    Ok(version.is_some())
}


pub fn assert_registry(store: &dyn Storage, addr: &str) -> Result<(), ContractError> {
    let res = REGISTRY_ADDRESS.load(store).map(|a| a == addr);
    if res.is_ok() && res.unwrap() {
        Ok(())
    } else {
        Err(ContractError::NotRegistry{})
    }
}





pub fn assert_caller(
    deps: Deps,
    sender: &str,
) -> Result<(), ContractError> {
    ensure!(
        WITH_CALLER.load(deps.storage)?,
        ContractError::NoDirectCall {}
    );
    ensure!(
        is_owner(deps.storage, &deps.api.addr_validate(sender)?)?,
        ContractError::Unauthorized {}
    );
    Ok(())
}


