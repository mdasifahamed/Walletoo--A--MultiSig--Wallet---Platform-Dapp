const {expect} = require('chai');
const { ethers } = require('hardhat');
const hre = require('hardhat');
const {loadFixture} = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const accounts = require('../scripts/utils/signers');


describe("should deploy The Factory With Factory Owner", function (){
   
    async function deployFactory() {
        const {factoryOwner} = await accounts.getAccounts();
        const contractF = await ethers.getContractFactory("WalletFactory");
        const factory = await contractF.connect(factoryOwner).deploy();
        return {factory};
    }

    it("Only EOA Can Be Able To Create Wallets", async()=>{
        const {factory} = await loadFixture(deployFactory);
        const{deployer1,deployer2,deployer3} = await accounts.getAccounts();
        const contratT = await ethers.getContractFactory("TestContract");
        const testCon = await contratT.connect(deployer1).deploy();
        
        const users = [deployer2.address,deployer3.address];
        try {
            await testCon.connect(deployer1).createWallet(await factory.getAddress(),users);
        } catch (error) {
            expect(error);
        }

        try {
            await factory.connect(deployer1).createWallet("fundings",users);
        } catch (error) {
            console.log(error);
        }

        const walletId = parseInt(await ethers.provider.getStorage(await factory.getAddress(),"0x5"))
        let walletAddress = await factory.connect(deployer3).getWalletAddressById(walletId);

        expect(walletAddress).to.be.not.equal(ethers.ZeroAddress);

       

    });

    it("One User Can Be Able To Create Multiple Wallets and All The Wallets Have Different Address", async()=>{
        const{factory} = await loadFixture(deployFactory);
        const {deployer1,deployer2,deployer3,deployer4,deployer5,deployer6} = await accounts.getAccounts();
        expect(await factory.connect(deployer1).createWallet("FundME",[deployer2.address,deployer3.address])).to.be.not.reverted;
        expect(await factory.connect(deployer1).createWallet("Travel",[deployer4.address,deployer5.address])).to.be.not.reverted;
        expect(await factory.connect(deployer1).createWallet("Feed Me",[deployer6.address,deployer4.address])).to.be.not.reverted;
        expect(await factory.connect(deployer3).getWalletAddressById(1)).to.be.not.equal(await factory.connect(deployer3).getWalletAddressById(2));
        expect(await factory.connect(deployer3).getWalletAddressById(2)).to.be.not.equal(await factory.connect(deployer3).getWalletAddressById(3));
        expect(await factory.connect(deployer3).getWalletAddressById(1)).to.be.not.equal(await factory.connect(deployer3).getWalletAddressById(3));
        // const walletbydep1 = await factory.connect(deployer1).getWalletAddressOfUser();
        // console.log(walletbydep1)

        /* If No Wallet Craetor Query for Wallets Of A User */

        try {
            await factory.connect(deployer6).getWalletAddressOfUser();
        } catch (error) {
            expect(error);
        }

    });
  
});

