use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    Coin, CosmosMsg as StdCosmosMsg, CustomMsg, SubMsg as StdSubMsg
};


#[cw_serde]
pub struct IbcFee {
    // the packet receive fee
    pub receive_fee: Vec<Coin>,
    // the packet acknowledgement fee
    pub ack_fee: Vec<Coin>,
    // the packet timeout fee
    pub timeout_fee: Vec<Coin>,
}

#[cw_serde]
pub struct RequestPacketTimeoutHeight {
    pub revision_number: Option<u64>,
    pub revision_height: Option<u64>,
}


#[cw_serde]
pub enum NeutronMsg {

    /// IbcTransfer sends a fungible token packet over IBC.
    IbcTransfer {
        // the port on which the packet will be sent
        source_port: String,
        // the channel by which the packet will be sent
        source_channel: String,
        // the tokens to be transferred
        token: Coin,
        // the sender address
        sender: String,
        // the recipient address on the destination chain
        receiver: String,
        // Timeout height relative to the current block height.
        // The timeout is disabled when set to 0.
        timeout_height: RequestPacketTimeoutHeight,
        // Timeout timestamp in absolute nanoseconds since unix epoch.
        // The timeout is disabled when set to 0.
        timeout_timestamp: u64,
        // Memo to be sent along with transaction.
        memo: String,
        // Fees to refund relayer for different kinds of `SudoMsg` transmission
        // Unused fee types will be returned to msg sender.
        fee: IbcFee,
    },

}

impl CustomMsg for NeutronMsg {}

pub type CosmosMsg = StdCosmosMsg<NeutronMsg>;
pub type SubMsg =   StdSubMsg<NeutronMsg>;
pub type Response = cosmwasm_std::Response<NeutronMsg>;
