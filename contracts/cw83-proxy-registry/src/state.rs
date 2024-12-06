use cosmwasm_schema::cw_serde;
use cw_storage_plus::{Item, Map};
use cw_accs::RegistryParams;
use saa::{CredentialData, CredentialId};


#[cw_serde]
pub struct CreationCache {
    pub account_data: CredentialData,
}

pub static CREATION_CACHE   : Item<CreationCache<>> = Item::new("cc");
pub static REGISTRY_PARAMS  : Item<RegistryParams> = Item::new("p");

pub static ACCOUNTS         :  Map<CredentialId, Vec<String>>  = Map::new("a");  
pub static CREDENTIALS      :  Map<CredentialId, CredentialId> = Map::new("c");
