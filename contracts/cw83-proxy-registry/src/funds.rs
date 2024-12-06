use cosmwasm_std::{ensure, Coin, MessageInfo, Storage, Uint128};
use cw_utils::PaymentError;

use crate::{error::ContractError, state::REGISTRY_PARAMS};


pub fn checked_funds(
    storage: &dyn Storage,
    info : &MessageInfo,
) -> Result<Vec<Coin>, ContractError> {
    ensure!(!info.funds.is_empty(), PaymentError::NoFunds {});
    let params = REGISTRY_PARAMS.load(storage)?;
    let mut forward_funds= Vec::<Coin>::with_capacity(info.funds.len());
    let mut fee_paid = false;
    for coin in info.funds.iter() {
        let fee_coin = params.creation_fees.iter().find(|c| c.denom == coin.denom);
        if let Some(fee_coin) = fee_coin {
            ensure!(
                fee_coin.amount <= coin.amount, 
                ContractError::InsufficientFee(fee_coin.amount.u128(), coin.amount.u128()
            ));

            let remaining = coin.amount
                    .checked_sub(fee_coin.amount)
                    .unwrap_or(Uint128::zero());

            if !remaining.is_zero() {
                forward_funds.push(Coin {
                    denom: fee_coin.denom.clone(),
                    amount: remaining
                });
            }
            fee_paid = true;
        } else {
            forward_funds.push(coin.clone());
        }
    }

    ensure!(fee_paid, ContractError::NoFeeTokens {});
    Ok(forward_funds)

}