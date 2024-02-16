// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

library ArrayLib{
    // Fucntion To get index of a elemnt in array
    function getUserIndex(address element,address [] memory elements) internal pure returns (uint256){
        uint256 index;
        uint256 elementsLength = elements.length;
        for(uint256 i = 0; i < elementsLength; i++){
            if(elements[i]==element){
                index = i;
                break;
            }
        }
        return index;
    }

    // function to check if a elements exist sin a arrya or not
    function isWalletUser(address element, address [] memory elements) internal pure returns (bool){
        bool isUser;
        uint256 elementsLength = elements.length;
        for (uint256 index = 0; index < elementsLength; index++) {
            if(element == elements[index]){
                isUser=true;
                break;
            }
        }
        return isUser;
    }

    // Function to check if A Elemnets repeats in a Arrau or not. 
    function checkDulpiAddress(address [] memory _users) internal pure  returns(bool){
        uint256 totalUsers = _users.length;
        bool dupli;
        for(uint256 i =0 ; i<totalUsers; i++){
            uint256 j = i+1;
            if(j==totalUsers){
                dupli = false;
            }
            else{
                if(_users[i]==_users[j]){
                    dupli =true;
                    break;
                }
            }
        }
       return dupli;
    }
}