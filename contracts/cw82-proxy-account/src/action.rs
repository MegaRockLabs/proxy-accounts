use crate::{
    error::ContractError, msg::ContractResult,
};
use cosmwasm_std::Env;
use cw_accs::{encode_feegrant_msg, BasicAllowance, CosmosMsg, ExecuteAccountMsg, Response};

pub const MINT_REPLY_ID: u64 = 1;


pub fn execute_action(
    env: &Env,
    msg: ExecuteAccountMsg,
) -> ContractResult {
    match msg {
        ExecuteAccountMsg::Execute { 
            msgs 
        } => try_executing(msgs),

        ExecuteAccountMsg::FeeGrant { 
            grantee, 
            allowance 
        } => try_fee_granting(env.contract.address.as_str(), &grantee, allowance), 

        _ => Err(ContractError::NotSupported {}),
    }
}


pub fn try_executing(
    msgs: Vec<CosmosMsg>,
) -> ContractResult {
    Ok(Response::new().add_messages(msgs))
}


pub fn try_fee_granting(
    contract: &str, 
    grantee: &str, 
    allowance: Option<BasicAllowance>
) -> ContractResult {

    let msg = encode_feegrant_msg(
        contract,
        grantee,
        allowance,
    )?;

    Ok(Response::new()
        .add_message(msg)
        .add_attribute("action", "fee_grant"))
}