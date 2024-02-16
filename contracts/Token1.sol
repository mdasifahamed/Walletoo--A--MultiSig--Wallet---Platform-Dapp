// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token1 is ERC20 {
    uint8 private constant DECIMAL = 8;
    uint256 private constant maxSupply = 1000000 * (10**DECIMAL);

    constructor() ERC20("TOKEN1", "TKN1"){

    }
    function mint(uint256 amount) public {
            if(amount<0 || amount>maxSupply){
                revert();
            }

            _mint(msg.sender, amount);
            // balanceOf(account);
            // transfer(to, value);
            // transferFrom(from, to, value);
    }
  


}