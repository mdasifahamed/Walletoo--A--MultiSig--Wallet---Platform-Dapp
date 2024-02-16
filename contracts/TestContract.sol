// SPDX-License-Identifier: MIT
pragma solidity  ^0.8.19;
import {MappLib} from "./libraries/MappLib.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {WalletFactory} from "./WalletFactory.sol";

contract TestContract{
     using Math for uint256;
    using MappLib for mapping(address=> mapping(uint256 => bool));
    mapping(address=> mapping(uint256 => bool)) votes;
    address [] voters;

     uint256 number;
    function addVote(uint256 requestId) public {
        votes[msg.sender][requestId]= true;
        voters.push(msg.sender);
    }

   function checkVotes(uint256 reqId) public view returns (bool){
        return MappLib.checkVote(votes, reqId, msg.sender);
   }
   function counVotes(uint256 reqId) public view returns(uint256){
        return MappLib.countVotes(votes, voters, reqId);
   }

   function creatWallet(address factory,  address [] memory users) public {
     WalletFactory(factory).createWallet("FundMe",users);
   }

   function attack(address destroy) public returns(bytes memory){
     address payable fund = payable(destroy);
     (bool success,bytes memory data) = destroy.call(abi.encodeWithSignature("getWalletAddressOfUser()"));
     
     require(success,"Falied");

     return data;
   }

}
    
