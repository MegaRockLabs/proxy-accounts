pub use cw82::{smart_account_query, CanExecuteResponse, ValidSignatureResponse, ValidSignaturesResponse,};
use cosmwasm_std::{Addr, Coin, Response};
use cw_accs::{ExecuteAccountMsg, InstantiateAccountMsg, MigrateAccountMsg, QueryAccountMsg};
use saa::{messages::{AccountCredentials, SignedDataMsg}, CredentialData};
use cosmwasm_schema::{cw_serde, schemars};

use crate::error::ContractError;




#[cw_serde]
pub enum CredQueryMsg {
    FullInfo {},
    Credentials {},
}


#[cw_serde]
pub struct FullInfoResponse {
    /// Current owner of the token account that is ideally a holder of an NFT
    pub ownership: cw_ownable::Ownership<Addr>,
    /// Registry address
    pub registry: String,
    /// Native fungible tokens held by an account
    pub balances: Vec<Coin>,
    /// Full info about installed credentials
    pub credentials: AccountCredentials
}



#[derive(serde::Serialize, serde::Deserialize, schemars::JsonSchema, Clone, Debug, PartialEq)]
pub struct SignedMessages {
    pub messages: Vec<ExecuteAccountMsg>
}



pub type InstantiateMsg = InstantiateAccountMsg;

pub type ExecuteMsg = ExecuteAccountMsg<SignedDataMsg, CredentialData>;

pub type MigrateMsg = MigrateAccountMsg;
pub type ContractResult = Result<Response, ContractError>;


pub type QueryMsg = QueryAccountMsg<SignedDataMsg, CredQueryMsg>;

