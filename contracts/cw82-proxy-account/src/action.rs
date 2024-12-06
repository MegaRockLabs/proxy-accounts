use crate::{
    error::ContractError, msg::ContractResult,
};
use cosmwasm_std::{CosmosMsg, Response};
use cw_accs::ExecuteAccountMsg;

pub const MINT_REPLY_ID: u64 = 1;


pub fn execute_action(
    msg: ExecuteAccountMsg,
) -> ContractResult {
    match msg {
        ExecuteAccountMsg::Execute { msgs } => try_executing(msgs),
        _ => Err(ContractError::NotSupported {}),
    }
}


pub fn try_executing(
    msgs: Vec<CosmosMsg>,
) -> ContractResult {
    Ok(Response::new().add_messages(msgs))
}


