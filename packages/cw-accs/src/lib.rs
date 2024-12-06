mod account;
mod registry;

pub use account::*;
pub use registry::*;

// re-exports for same version usage
pub use cosmwasm_schema;
pub use cosmwasm_std;

pub type CreateAccountMsg<T> = cw83::CreateAccountMsg<ProxyAccount<T>>;
