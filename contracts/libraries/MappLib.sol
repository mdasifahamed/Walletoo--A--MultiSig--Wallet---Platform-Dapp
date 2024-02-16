// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library MappLib{

   

    function checkVote(mapping(address=> mapping(uint256 => bool)) storage votes,uint256 requestId, address sender) internal view returns(bool){

        return votes[sender][requestId];
    }

    function countVotes(mapping(address=> mapping(uint256 => bool)) storage votes, address[] storage voters,uint256 requestId) internal view returns(uint256 count){

        count =0;
        uint256 totalVoters = voters.length;
        for(uint256 i = 0 ; i< totalVoters ; i++){

            if(votes[voters[i]][requestId]){
                count++;
            }
        }

        return count;
        
    }

    

}