use cosmwasm_std::{ensure, from_json, CosmosMsg, Deps, Env, StdError, StdResult, Binary};
use cw82::{CanExecuteResponse, ValidSignatureResponse, ValidSignaturesResponse};
use saa::messages::{AccountCredentials, AuthPayload, MsgDataToSign, SignedDataMsg};

use crate::{
    msg::FullInfoResponse,
    state::REGISTRY_ADDRESS, utils::assert_caller,

};


pub fn can_execute(
    deps: Deps,
    env: Env,
    sender: String,
    msg: CosmosMsg<SignedDataMsg>,
) -> StdResult<CanExecuteResponse> {

    let can_execute = match msg {
        CosmosMsg::Custom(
            signed
        ) => {
            let data : MsgDataToSign = from_json(signed.data)?;
            data.validate_cosmwasm(deps.storage, &env).is_ok()
        },
        _ => assert_caller(deps,  &sender).is_ok(),
    };

    Ok(CanExecuteResponse { can_execute })
}

pub fn valid_signature(
    deps: Deps,
    env: Env,
    data: Binary,
    signature: Binary,
    payload: Option<Binary>,
) -> StdResult<ValidSignatureResponse> {    
    
    let payload = payload
    .map(|p| from_json::<AuthPayload>(p)).transpose()?;

    let is_valid = saa::verify_signed_queries(
        deps.api,
        deps.storage, 
        &env,
        SignedDataMsg { data: data.into(), signature: signature.into(), payload },
    )
    .is_ok();

    Ok(ValidSignatureResponse { is_valid })
}

pub fn valid_signatures(
    deps: Deps,
    env: Env,
    data: Vec<Binary>,
    signatures: Vec<Binary>,
    payload: Option<Binary>,
) -> StdResult<ValidSignaturesResponse> {

    ensure!(
        data.len() == signatures.len(),
        StdError::generic_err("Data and signatures must be of equal length")
    );

    let payload = payload
            .map(|p| from_json::<AuthPayload>(p)).transpose()?;
    

    let are_valid: Vec<bool> = signatures
        .into_iter()
        .enumerate()
        .map(|(index, signature)| {
            let data = data[index].clone();
            saa::verify_signed_queries(
                deps.api,
                deps.storage, 
                &env,
                SignedDataMsg { 
                    data: data.into(), 
                    signature: signature.into(), 
                    payload: payload.clone()
                },
            )
            .is_ok()
         
        })
        .collect();

    Ok(ValidSignaturesResponse { are_valid })
}





pub fn credentials(
    deps: Deps,
) -> StdResult<AccountCredentials> {
    saa::get_all_credentials(deps.storage)
    .map_err(|_| StdError::generic_err("Error getting credentials"))

}


pub fn full_info(
    deps: Deps,
    env: Env,
) -> StdResult<FullInfoResponse> {
    let balances = deps.querier.query_all_balances(env.contract.address)?;
    let ownership = cw_ownable::get_ownership(deps.storage)?;
    let credentials = credentials(deps)?;

    Ok(FullInfoResponse {
        balances,
        ownership,
        credentials,
        registry: REGISTRY_ADDRESS.load(deps.storage)?,
    })
}
