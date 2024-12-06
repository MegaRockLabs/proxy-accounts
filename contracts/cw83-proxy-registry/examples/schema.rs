use cosmwasm_schema::write_api;
use cosmwasm_std::Binary;
use cw83_proxy_registry::msg::{ExecuteMsg, InstantiateMsg, MigrateMsg, QueryMsg};

fn main() {
    write_api! {
        name: "cw83_proxy_registry",
        instantiate: InstantiateMsg,
        query: QueryMsg,
        execute: ExecuteMsg<Binary>,
        migrate: MigrateMsg,
    }
}
