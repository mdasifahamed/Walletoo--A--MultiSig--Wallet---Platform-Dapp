require("@nomicfoundation/hardhat-toolbox");
require("hardhat-tracer");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  defaultNetwork: 'localhost',

  paths:{
    openzeppelin:'@openzeppelin/contracts'
  }

};
