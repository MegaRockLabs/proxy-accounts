use cosmwasm_schema::{cw_serde, serde::Serialize};
use cosmwasm_std::{Coin, Empty};
use saa::CredentialData;

use crate::ExecuteAccountMsg;



#[cw_serde]
pub struct RegistryParams<T = Option<Empty>> {
    pub allowed_code_ids: Vec<u64>,
    pub creation_fees: Vec<Coin>,
    pub managers: Vec<String>,
    pub extension: T,
}


/// An extenstion for [cw83::CreateAccountMsg]
#[cw_serde]
pub struct ProxyAccount<D = CredentialData>
where
    D: Serialize,
{
    /// Account data used for (cw81 signature verification)
    pub account_data: D,

    /// Actions to be executed on account creation
    pub actions: Option<Vec<ExecuteAccountMsg>>,
}
