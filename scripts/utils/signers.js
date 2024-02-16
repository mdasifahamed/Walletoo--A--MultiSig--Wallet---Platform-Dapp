const {ethers} = require('hardhat');
const getAccounts  = async ()=>{
    const[factoryOwner,deployer1,deployer2,deployer3,deployer4,deployer5,deployer6,deployer7,
        deployer8,deployer9,deployer10,tokenOwner1,tokenOwner2] = await ethers.getSigners();

    return{factoryOwner,deployer1,deployer2,deployer3,deployer4,deployer5,deployer6,deployer7,
        deployer8,deployer9,deployer10,tokenOwner1,tokenOwner2}
   
}

module.exports = {
    getAccounts,
}