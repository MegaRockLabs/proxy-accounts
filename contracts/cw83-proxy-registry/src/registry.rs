use cosmwasm_schema::{cw_serde, serde::Serialize};
use cosmwasm_std::{
    to_json_binary, Addr, Binary, Coin, CosmosMsg, Deps, ReplyOn, StdResult, SubMsg,
};
use cw83::{Cw83RegistryBase, CREATE_ACCOUNT_REPLY_ID};
use cw_accs::InstantiateAccountMsg;

pub fn construct_label(serial: Option<u64>) -> String {
    let base = format!("proxy-account");
    match serial {
        Some(s) => format!("{}-{}", base, s),
        None => base,
    }
}

#[cw_serde]
pub struct Cw83ProxyRegistryContract(pub Addr);

impl Cw83ProxyRegistryContract {
    pub fn addr(&self) -> Addr {
        self.0.clone()
    }

    fn cw83_wrap(&self) -> Cw83RegistryBase {
        Cw83RegistryBase(self.addr())
    }

    fn init_binary<T: Serialize, E: Serialize>(
        &self,
        account_data: T,
        actions: Option<Vec<CosmosMsg<E>>>,
    ) -> StdResult<Binary> {
        let msg = InstantiateAccountMsg {
            account_data,
            actions,
        };

        to_json_binary(&msg)
    }

    pub fn create_account_init_msg<T: Serialize, E: Serialize>(
        &self,
        code_id: u64,
        account_data: T,
        funds: Vec<Coin>,
        serial: Option<u64>,
        actions: Option<Vec<CosmosMsg<E>>>,
    ) -> StdResult<CosmosMsg> {
        self.cw83_wrap().create_account_init_msg(
            code_id,
            self.init_binary(account_data, actions)?,
            funds,
            construct_label(serial),
        )
    }

    pub fn create_account_sub_msg<T: Serialize, E: Serialize>(
        &self,
        code_id: u64,
        account_data: T,
        funds: Vec<Coin>,
        serial: Option<u64>,
        actions: Option<Vec<CosmosMsg<E>>>,
    ) -> StdResult<SubMsg> {
        Ok(SubMsg {
            id: CREATE_ACCOUNT_REPLY_ID,
            msg: self.create_account_init_msg(
                code_id,
                account_data,
                funds,
                serial,
                actions,
            )?,
            reply_on: ReplyOn::Success,
            gas_limit: None,
        })
    }

    pub fn supports_interface(&self, deps: Deps) -> StdResult<bool> {
        self.cw83_wrap().supports_interface(&deps.querier)
    }
}
