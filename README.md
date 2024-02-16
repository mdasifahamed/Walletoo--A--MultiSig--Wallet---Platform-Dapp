# Walletoo A Decentrazied Platform Where Users Can Create Multisignature Wallets Which Also Accepts ERC20 Tokens.

## Summary
On the platform, users can create a `MultiSig Wallet`. Users of the wallet are the owners, implemented with decentralized power, meaning no one can interrupt their monetary transactions. The wallet also supports `ERC20` tokens. Operations such as `Fund Transfer`, `User Addition/Removal`, and `ERC20 Token` management are governed by the voting mechanism of the wallet users. This means that for every operation, users must vote, and upon successful voting, the operation is executed automatically.

## Requirements For Creating A Wallet
1. Minumum 3 Users Are Need For Creating Wallet.
2. And The Users Must Unique Not Same Users.
3. A Name For The Wallet.
4. Some Native Token Based On which Chain The Wallet Is Going To Deploy For Deployment Fee.

**Voting Mechanism of The Wallet** 

```
The Wallet Maintain M of N Voting Mechanism.
If We Think That M Is The Total Number Of The Wallet.
Then N Will Be The Minimum Number Of The Votes To Execute Transaction Or Operation.
And N Is Set As N = M-1.
So If Total Number Of The User M Is = 5
Then Minimum Voting Will Be N  = M-1 = 5-1 = 4
That Means Minumum 4 Votes Is Required To Execute A Transaction/Operation For Wallet Of 5 Members.
```





# To Try The Project Follow The Steps
1. At First Clone The Repositiory

```shell
git clone https://github.com/mdasifahamed/Walletoo--A--MultiSig--Wallet---Platform-Dapp.git
```
2. Then Install The Dependencies

```shell
npm i
```
3. Then Run The Test To See The Tests

First run the localchain of the `Hardhat`

```shell
npx hardhat node
``` 
Then Run The Tests

```shell
npx hardhat test
```

# OverView Of The Contracts

### WalletFactory.sol

**Purpose:** The WalletFactory contract serves as a factory for creating instances of another contract called Wallet.
Each Wallet instance represents a multisignature wallet where multiple users can submit and vote on transactions.

**Key Features:**
- WalleCreations:
The `WalletFactory::createWallet()` function allows an external account `(EOA)` to create a new multisignature wallet.
Criteria for wallet creation include being an `EOA` and having at least three members (including the wallet creator).
- User Wallet Management:
The contract keeps track of wallet creators, wallet addresses, and the mapping of creators to wallets.
A creator can query the wallets they have created using the `WalletFactory::getWalletAddressOfUser()` function.
- Wallet Lookup:
The `WalletFactory::getWalletAddressById()` function allows users to retrieve the wallet address based on its ID.

- Internal Functions:
`WalletFactory::isWalletCreator()` Checks if an address is a wallet creator. `WalletFactory::NotEOA()` Checks if an address is an external account (not a contract).

### Wallet.sol

**Purpose:** The Wallet contract represents a multisignature wallet where users can propose and vote on transactions and user management of the wallet.

**Key Features:**
- User Management:
Users can be added or removed from the wallet using the `Wallet::submitUserAddOrRemoveRequest()` function.
The contract maintains a list of users, and each user has a corresponding fund balance.

- Transaction Requests:
Users can submit transaction requests using the `Wallet::submitTransactionRequest()` function.
Requests can involve either `Ether` transfers or `ERC20 Token` transfers.

- Voting System:
Voting System:
Users can vote on user add/remove requests `Wallet::voteOnAddOrRemoveMember()` and transaction requests `Wallet::voteOnTrxReq()`. If a request reaches the voting threshold, it gets executed.

- Internal Functions:
    - `Wallet::addUser()` : Adds a user to the wallet.
    - `Wallet::removeUser()`: Removes a user from the wallet.
    - `Wallet::executeTrx()`: Executes an Ether transfer for a transaction request.
    - `Wallet::isToken()`: Checks if an address is a contract (token).

- Fallback Function:
The contract includes a fallback function that allows users to send Ether to the wallet, updating their fund balance.

## Note:
The contracts make use of various modifiers to ensure that only authorized actions can be performed.
Both contracts are designed to be interacted with primarily by external accounts `(EOAs)` and not `other contracts`.
In summary, the `WalletFactory` contract acts as a factory for creating `multisignature wallets` `Wallet contracts` with specified criteria, while the `Wallet` contract manages `users`, `handles transaction requests`, and implements a `voting system` for executing requests.








