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

