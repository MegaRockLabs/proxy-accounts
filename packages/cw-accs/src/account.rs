use cosmwasm_schema::{cw_serde, serde::Serialize, QueryResponses};
use cosmwasm_std::{Binary, CosmosMsg, Empty};
use cw82::smart_account_query;
use cw_ownable::cw_ownable_query;
use saa::UpdateOperation;
use schemars::JsonSchema;



#[cw_serde]
pub struct MigrateAccountMsg<T = Empty> {
    pub params: Box<Option<T>>,
}





#[cw_serde]
pub enum ExecuteAccountMsg<T = Empty, A : Serialize = Binary, E = Option<Empty>> {
    /// Proxy method for executing cosmos messages
    /// Wasm and Stargate messages aren't supported
    /// Only the current holder can execute this method
    Execute { msgs: Vec<CosmosMsg<T>> },
 
    /// Owner only method to update account data
    UpdateAccountData {
        /// Old data to proof ownership
        account_data: Option<A>,
        /// New account data
        operation: UpdateOperation<A>,
    },

    /// Extension
    Extension { msg: E },
}



#[smart_account_query]
#[cw_ownable_query]
#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryAccountMsg<T = Empty, Q: JsonSchema = Empty> {
    /// Registry address
    #[returns(String)]
    Registry {},

    /// Incremental number telling wether a direct interaction with the account has occured
    #[returns(u128)]
    AccountNumber {},

    #[returns(())]
    Extension { msg: Q },
}






#[cw_serde]
pub struct InstantiateAccountMsg<A = ExecuteAccountMsg, T = Binary>
where
    T: Serialize,
{
    /// Customiable payload specififc for account implementation
    pub account_data: T,
    /// Actions to execute immediately on the account creation
    pub actions: Option<Vec<A>>,
}
