use crate::error::ContractError;
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Api, Binary, ContractInfo, Env, MessageInfo, Storage};
use cw_storage_plus::{Item, Map};
use saa::{
    CredentialData, CredentialId
};

#[cw_serde]
pub struct CredentialInfo<E = Binary> {
    pub name: String,
    pub hrp: Option<String>,
    pub extension: Option<E>,
}


pub static REGISTRY_ADDRESS: Item<String> = Item::new("r");
pub static MINT_CACHE: Item<String> = Item::new("m");
pub static SERIAL: Item<u128> = Item::new("l");

pub static VERIFYING_CRED_ID: Item<CredentialId> = Item::new("v");
pub static WITH_CALLER: Item<bool> = Item::new("w");

pub static CREDENTIALS: Map<CredentialId, CredentialInfo> = Map::new("c");
pub static KNOWN_TOKENS: Map<(&str, &str), bool> = Map::new("k");
pub static NONCES: Map<u128, bool> = Map::new("n");


pub fn save_credentials(
    api: &dyn Api,
    storage: &mut dyn Storage,
    env: &Env,
    info: MessageInfo,
    data: CredentialData,
) -> Result<(), ContractError> {
    let with_caller = data.with_caller.unwrap_or_default();
    WITH_CALLER.save(storage, &with_caller)?;
    
    let registry_env = Env {
        contract: ContractInfo { address: info.sender.clone() },
        ..env.clone()
    };

    data.save_cosmwasm(api, storage, &registry_env, &info)?;
    Ok(())
}
