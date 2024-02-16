// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Wallet.sol";

contract WalletFactory{

    error  WalletFactory___InvalidRequester(address walletCreator);
    error WalletFactory___NotAWalletCreator(address requester);
    
    mapping(address=>address[]) private creatorToWallet;
    mapping(uint256=>address) private walletIdToWalletAddress;
    address [] private walletCreators;
    address[] private wallets;

    address private factoryOwner;
    uint256 private walletId;

    event WalletCreated(address indexed walletAddress, uint256 indexed walletId);

    constructor(){
        factoryOwner = msg.sender;
    }
 
    /// @notice createWallet() is the fucntion to craete a Multisg Wallet Which is a Smart Contract 
    /// @dev It Check Some Criteria Which Are Only An EOA Can Craete Wallet Other Contract Can't Wallet
    /// And At Least Reuqired 3 Member to craete The Wallet Including The Wallet Creator.
    /// It Creates The The Wallet By Importing The Wallet Contract From Wallet.sol. using Contract Creation.
    /// @param wallet_name Is The name Of The Wallet That Going To Be Created
    /// @param _users Is The Array of Users Which Must Be Contain Two Address No Duplicate Address 
    /// You Find More On Creating Multisig Wallet Cretaion on the Wallet.sol n Its contructor.
    /// It lets Crete Multiple Wallets From A Single EOA.
    function createWallet(string calldata wallet_name, address[] calldata _users) external{
        if(NotEOA(msg.sender) || (msg.sender == address(0))){
            revert WalletFactory___InvalidRequester(msg.sender);
        }
        walletId = walletId + 1;
        Wallet wallet = new Wallet(wallet_name,_users, msg.sender);
        creatorToWallet[msg.sender].push(address(wallet));
        walletIdToWalletAddress[walletId] = address(wallet);
        if(!isWalletCreator(msg.sender)){
            walletCreators.push(msg.sender);
        }
        wallets.push(address(wallet));
        emit WalletCreated(address(wallet), walletId);
        
    }

    /// @notice getWalletAddressOfUser () returns All Crreated Wallest Of Sepcsing User.

    function getWalletAddressOfUser() public view returns(address [] memory){
        if(!isWalletCreator(msg.sender)){
            revert WalletFactory___NotAWalletCreator(msg.sender);
        }
        require(isWalletCreator(msg.sender), "Only Creator");
        uint8 numberofWallets = uint8(creatorToWallet[msg.sender].length);
        address[] memory Wallets = new address [](numberofWallets);
        for (uint8 index = 0; index < creatorToWallet[msg.sender].length; index++) {
            Wallets[index]=creatorToWallet[msg.sender][index];  
            // Here push mthod wont works as the array locations is declared 
            // memory          
        }
        return wallets;

    }
    // Helper Function For Validating Wallet Creator Exits;
    function isWalletCreator(address _creator) internal view returns (bool){
        bool isCreator;
        for (uint256 index = 0; index < walletCreators.length; index++) {
            if(_creator == walletCreators[index]){
                isCreator = true;
                break;
            }
        }
        return isCreator;
    }

    //Get Wallet Address By Wallet id
    //If Anyone forgets The Wallet Address.
    //can be Recoverd By Wallet Id

    function getWalletAddressById(uint256 _walletId) external view returns(address){
        return walletIdToWalletAddress[_walletId];
    } 

    // To check a Address If It Is EOA Or A Its Is Contract Address
    function NotEOA(address addr) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    


}