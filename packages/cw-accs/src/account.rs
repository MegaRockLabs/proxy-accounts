use anybuf::Anybuf;
use cosmwasm_schema::{cw_serde, serde::Serialize, QueryResponses};
use cosmwasm_std::{Binary, Coin, Empty, StdResult, Timestamp, CosmosMsg as StdCosmosMsg};
use cw82::smart_account_query;
use saa::{CredentialData, UpdateOperation};
use schemars::JsonSchema;

use crate::{msg::NeutronMsg, CosmosMsg};


#[cw_serde]
pub struct MigrateAccountMsg<T = Empty> {
    pub params: Box<Option<T>>,
}


#[cw_serde]
pub struct BasicAllowance {
    pub expiration  : Option<Timestamp>,
    pub spend_limit : Vec<Coin>,
}



#[cw_serde]
pub enum ExecuteAccountMsg<
    T : JsonSchema = NeutronMsg, 
    A : Serialize = Binary, 
    E = Option<Empty>
> {
    /// Proxy method for executing cosmos messages
    /// Wasm and Stargate messages aren't supported
    /// Only the current holder can execute this method
    Execute { msgs: Vec<StdCosmosMsg<T>> },


    /// Issue a fee grant to another account
    FeeGrant {
        grantee     :   String,
        allowance   :   Option<BasicAllowance>
    },
 
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
pub struct InstantiateAccountMsg<A = ExecuteAccountMsg, T = CredentialData>
where
    T: Serialize, A : Serialize
{
    /// Customiable payload specififc for account implementation
    pub account_data: T,
    /// Actions to execute immediately on the account creation
    pub actions: Option<Vec<A>>,
}







pub fn encode_feegrant_msg(
    granter       : &str, 
    grantee       : &str,
    allowance     : Option<BasicAllowance>,
) -> StdResult<CosmosMsg> {

    let (spend_limit, expiration) = match allowance {
        Some(allowance) => {
            let coins  = allowance.spend_limit
                .iter()
                .map(|coin| Anybuf::new() 
                    .append_string(1, &coin.denom)
                    .append_string(2, &coin.amount.to_string())
                )
                .collect();

            let expiration = allowance.expiration
                .map(|ts| Anybuf::new()
                    .append_int64(1, ts.seconds() as i64)
                    .append_int32(2, 0i32)
                );
            
            (coins, expiration)

        },
        None => (vec![], None),
    };

    let mut basic_msg = Anybuf::new()
        .append_repeated_message(1, &spend_limit);
    
    if expiration.is_some() {
        basic_msg = basic_msg.append_message(2, &expiration.unwrap());
    }

    let basic  = Anybuf::new()
        .append_string(1, "/cosmos.feegrant.v1beta1.BasicAllowance")
        .append_message(2, &basic_msg);


    let allowed_msg = Anybuf::new()
        .append_string(1, "/cosmos.feegrant.v1beta1.AllowedMsgAllowance")
        .append_message(2,&Anybuf::new()
            .append_message(1, &basic)
            .append_repeated_string(2, &["/cosmwasm.wasm.v1.MsgExecuteContract"])
        );


    let msg : CosmosMsg = CosmosMsg::Stargate {
        type_url: "/cosmos.feegrant.v1beta1.MsgGrantAllowance".to_string(),
        value: anybuf::Anybuf::new()
                .append_string(1, granter)
                .append_string(2, grantee)
                .append_message(3, &allowed_msg)
                .into_vec()
                .into()
    };


    Ok(msg)
}

