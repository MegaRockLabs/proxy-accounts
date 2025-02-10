use crate::error::ContractError;
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Api, Binary, ContractInfo, Env, MessageInfo, Storage};
use cw_storage_plus::Item;
use saa::
    CredentialData
;

#[cw_serde]
pub struct CredentialInfo<E = Binary> {
    pub name: String,
    pub hrp: Option<String>,
    pub extension: Option<E>,
}


pub static REGISTRY_ADDRESS: Item<String> = Item::new("r");
pub static WITH_CALLER: Item<bool> = Item::new("w");


pub fn save_credentials(
    api: &dyn Api,
    storage: &mut dyn Storage,
    env: &Env,
    info: MessageInfo,
    data: CredentialData,
) -> Result<(), ContractError> {
    let with_caller = data.with_caller.unwrap_or_default();
    WITH_CALLER.save(storage, &with_caller)?;

    let owner = data.credentials
        .iter().find(|c|c.is_cosmos_derivable());

    if owner.is_some() {
        cw_ownable::initialize_owner(
            storage, api, Some(owner.unwrap().cosmos_address(api)?.as_str())
        )?;
    }
 
    let registry_env = Env {
        contract: ContractInfo { address: info.sender.clone() },
        ..env.clone()
    };

    data.save_cosmwasm(api, storage, &registry_env, &info)?;
    Ok(())
}
