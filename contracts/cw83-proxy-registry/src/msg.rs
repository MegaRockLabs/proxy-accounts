use cosmwasm_schema::{cw_serde, serde::Serialize, QueryResponses};
use cosmwasm_std::{Binary, Coin, Empty};
use cw83::{
    registry_query, AccountInfoResponse as AccountInfoResponseBase,
    AccountQuery as AccountQueryBase,
};

use cw_accs::{CreateAccountMsg, RegistryParams};
use saa::{CredentialData, UpdateOperation};

#[cw_serde]
pub struct InstantiateMsg {
    pub params: RegistryParams,
}



/// An full account stored in the registry
#[cw_serde]
pub struct Account {
    /// Address of the token-bound account
    pub address: String,
}


#[cw_serde]
pub struct AccountsResponse {
    /// Total number of accounts in the registry
    pub total: u32,
    /// List of the accounts matching the query
    pub accounts: Vec<Account>,
}


#[cw_serde]
pub enum CredentialQuery {
    One(Binary),
    Many(Vec<Binary>)
}



pub type AccountQuery = AccountQueryBase<CredentialQuery>;
pub type AccountInfoResponse = AccountInfoResponseBase<Empty>;



#[registry_query]
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {


    /// Query params of the registry
    #[returns(RegistryParams)]
    RegistryParams {},
}

#[cw_serde]
pub struct MigrateMsg {}


#[cw_serde]
pub enum ExecuteMsg<T = CredentialData>
where
    T: Serialize,
{
    CreateAccount(CreateAccountMsg<T>),

    UpdateAccountData {
        /// Existing acccount data to proof ownership
        account_data: T,
        /// New account data to add or remove
        operation: UpdateOperation<T>,
    },

    Forward {
        /// Address of the account to forward the message to
        address: String,
        /// Amount of tokens to forward
        amount: Option<Vec<Coin>>,
        /// Message to forward
        msg: Option<Binary>,
    },

}


#[cw_serde]
pub enum SudoMsg {
    /// updating the entire registry params object
    UpdateParams(Box<RegistryParams>),
    /// updating an address that is used for fair fee burning
    UpdateFairBurnAddress(String),
    /// updating the list of code ids that are allowed for account creation & migration
    UpdateAllowedCodeIds { code_ids: Vec<u64> },
    /// manager contracts that can update an owner for an account if the latter is the new holder of the bound NFT
    UpdateManagers { managers: Vec<String> },
}
