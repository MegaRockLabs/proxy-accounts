# Proxy Accounts

Proxy Accounts are smart contract based accounts or embed wallets used as an entry point to the blockchain and its applications. Accounts are controlled can be controlled by custom authentication methods, such as multi-chain cosmos public key, ethereum personal sign messages, passkeys (webauthn) and more. 

See [smart-account-auth](https://github.com/MegaRockLabs/smart-account-auth) library for more details.


## Architecture

### Registry

The registry is a smart contract that stores the list of all the proxy accounts. It is used to keep track of all the accounts and their respective owners. Dapp developers or users are able to query the registry to get the list of smart accounts against a specific authenticating credential. For example if a user is connecting with a Metamask wallet, the registry will be able to tell if there is already a smart account controlled by the same address and allow to create a new one if not. The contract follows [cw83](https://github.com/MegaRockLabs/cw-extra/tree/main/packages/cw83) interface standard.


### Account

The account is a simple proxy that allows to perform any CosmosMsg a normal wallet would be able to do. In order to perform an action or a list of actions, the user must sign a message with encoded actions, account sequence number, contract address and chain id. Account contracts follow the [cw82](https://github.com/MegaRockLabs/cw-extra/tree/main/packages/cw82) interface standard and have additional hardcoded actions like `fee_grant`to simplify life for front-end developers.


### Frontend

The frontend is a simple web application that allows users to create a new account and interact with any smart contract or application by using the account as a proxy. The frontend rely on in-browser wallets that create native cosmos signatures and transactions to interact with the blockchain and pass actual authentacating credentials to the smart accounts. The frontend is also responsible for seamless bridging, routing and swapping of tokens between different chains. In this case it heavily relies on Skip API

