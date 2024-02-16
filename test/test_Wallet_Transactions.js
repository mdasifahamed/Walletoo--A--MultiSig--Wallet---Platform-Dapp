const hre = require('hardhat');
const {ethers} = require("hardhat");
const{expect} = require('chai');
const {loadFixture} = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const accounts = require("../scripts/utils/signers");

describe("Wallet Transactions With Ethers,Token", function(){

    async function deployFactoryAndCreateWalletAndTokens() {
        
        const {factoryOwner,deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2,} = await accounts.getAccounts(); const contractToken1 = await ethers.getContractFactory("Token1");
        const contractToken2 = await ethers.getContractFactory("Token2");
        const contractFactory = await ethers.getContractFactory("WalletFactory");
        
        const token1 = await contractToken1.connect(tokenOwner1).deploy();
        const token2 = await contractToken1.connect(tokenOwner2).deploy();
        const factory = await contractFactory.connect(factoryOwner).deploy();

        try {
            // create Wallet with more 4
            await factory.connect(deployer1).createWallet("Travel Fund",[deployer2.address,deployer3.address,deployer4.address,deployer5.address]);
        } catch (error) {
            console.log(error);
        }

        // getWallet Adddress 

        const wallletAdd = await factory.connect(deployer1).getWalletAddressById(1);

        // creat wallet from contract address and abi to interact

        const walletartifact = await hre.artifacts.readArtifact("Wallet");
        const Wallet = await ethers.getContractAt(walletartifact.abi,wallletAdd);

        // mint the tokens

        try {
            await token1.connect(tokenOwner1).mint(1000);
            await token2.connect(tokenOwner2).mint(1000);
        } catch (error) {
            console.log(error);
        }

        return {Wallet,token1, token2, deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2}
    }

    it("Everything Should Be Fine", async()=>{
        const {Wallet,token1, token2, deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2} = await loadFixture(deployFactoryAndCreateWalletAndTokens);
        let walletUsers  = await Wallet.connect(deployer1).getAllUsers();
        walletUsers = walletUsers[1]; // as getAllUsers() returns a tupple oa allthe users and total numeros the users .
        expect(walletUsers).to.be.equal(5);
        expect(await Wallet.connect(deployer2).getVotingThreshOld()).to.be.equal(4);
        expect(await token1.balanceOf(tokenOwner1.address)).to.be.equal(1000);
        expect(await token2.balanceOf(tokenOwner2.address)).to.be.equal(1000);
        expect(await token2.balanceOf(tokenOwner1.address)).to.be.equal(0);
        expect(await token1.balanceOf(tokenOwner2.address)).to.be.equal(0);


    });

    it("Contract Should Be Able To Accept Ethers Only From the Wallet Users and Mapped To UsreToFund",async()=>{
        const {Wallet,token1, token2, deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2} = await loadFixture(deployFactoryAndCreateWalletAndTokens);
        const WalletAdd = await Wallet.getAddress();
        try {
            // token1Oner1  is not Wallet his Tranfer Fund Sholud be reverted

          
            await tokenOwner1.sendTransaction({
                value: ethers.parseEther("1"),
                to:WalletAdd,
            });
        } catch (error) {
            expect(error);
        }

        // dep1,2,3,4,5,are wallet they shsloud be ablle send ether

        const balanceBeforefund = await ethers.provider.getBalance(WalletAdd);

        try {
            let trx1 = await deployer1.sendTransaction({
                value: ethers.parseEther("1"),
                to:WalletAdd,
            });
            let rcrpiet1 = trx1.wait();
            
            let trx2 = await deployer2.sendTransaction({
                value: ethers.parseEther("1"),
                to:WalletAdd,
            });
            let rcrpiet2 = trx2.wait();


        } catch (error) {
            console.log(error);
        }
        const balanceafterfund = await ethers.provider.getBalance(WalletAdd);
        
        expect((balanceafterfund)).to.be.greaterThan((balanceBeforefund));
        expect((balanceafterfund)).to.be.equal(ethers.parseEther("2"));
        expect((balanceBeforefund)).to.be.equal(0);

        //user fund should be mapped to their address

        try {
            await deployer3.sendTransaction({
                value:ethers.parseEther("2"),
                to:WalletAdd
            });

            await deployer3.sendTransaction({
                value:ethers.parseEther("2"),
                to:WalletAdd
            });

        } catch (error) {
            console.log(error);
        }

        const deployer3Funded = await Wallet.connect(deployer3).getUserFundedAmount(deployer3.address);

        // As dep4 funded 2 ether twice his total fund shild be 4 ether

        expect(deployer3Funded).to.be.equal(ethers.parseEther("4"));

        //dep4 hs not funded yet so his funded amount sholu bde zero

        expect(await Wallet.connect(deployer4).getUserFundedAmount(deployer4.address)).to.be.equal(0);



    });

    it("Wallet Should Be Able to Accept ERC20 Token",async()=>{
        const {Wallet,token1, token2, deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2} = await loadFixture(deployFactoryAndCreateWalletAndTokens);
        const WalletAdd = await Wallet.getAddress();

        try {
            await token1.connect(tokenOwner1).transfer(WalletAdd,100);
            await token2.connect(tokenOwner2).transfer(WalletAdd,100);
        } catch (error) {
            console.log(error);
        }

        expect(await token1.balanceOf(WalletAdd)).to.be.equal(100);
        expect(await token2.balanceOf(WalletAdd)).to.be.equal(100);
        expect(await token2.balanceOf(tokenOwner2)).to.be.equal(900);
        expect(await token1.balanceOf(tokenOwner1)).to.be.equal(900);



    });
    it("On Successfull Vote wallet Should Transfer Ether To the Corresponsed Reeciever And Transaction be revrted if The Amount of Sendinf ether Execeed Cuurent Wallet Balace",async()=>{
        // Wallet has 5 member Vote requrired to Pass A proposal is 4 vote
        // Else Transation sholud ne be executed 

        // Add Some ethers to the Wallet
        
        const {Wallet,token1, token2, deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2} = await loadFixture(deployFactoryAndCreateWalletAndTokens);
        
        await deployer1.sendTransaction({
            value: ethers.parseEther("5"),
            to: await Wallet.getAddress(),
        });

        expect(await ethers.provider.getBalance(await Wallet.getAddress())).to.be.equal(ethers.parseEther("5"));

        // Create 2 Proposal In One We Will Vote 100% And In Another We Will Note Vote 100%

        const {deployer7,deployer8,deployer9} = await accounts.getAccounts();
    
        try {
            await Wallet.connect(deployer2).submitTransactionRequest(deployer7.address,ethers.ZeroAddress,ethers.parseEther("3"),2);
            await Wallet.connect(deployer2).submitTransactionRequest(deployer8.address,ethers.ZeroAddress,ethers.parseEther("2"),2);

        } catch (error) {
            console.log(error);
        }

        // User From Out ISde Wllet Cannot Submit For Tarnsaction

        try {
            await Wallet.connect(deployer8).submitTransactionRequest(deployer7.address,ethers.ZeroAddress,ethers.parseEther("2"),2);
            
        } catch (error) {
            expect(error);
        }
        // let vote first request
        // Before Succesfull Vote Contarctbalance 
        const balanceBefore = await ethers.provider.getBalance(await Wallet.getAddress());
        expect(balanceBefore).to.be.equal(ethers.parseEther("5"));
        const usersBalanceBefore = await ethers.provider.getBalance(deployer7.address); 
        await Wallet.connect(deployer1).voteOnTrxReq(1);
        await Wallet.connect(deployer3).voteOnTrxReq(1);
        await Wallet.connect(deployer4).voteOnTrxReq(1);
        const balanceAfter = await ethers.provider.getBalance(await Wallet.getAddress());
        expect(balanceAfter).to.be.equal(ethers.parseEther("2"));
        expect(await ethers.provider.getBalance(deployer7.address)).to.be.equal(usersBalanceBefore + ethers.parseEther("3"));

        // req 2 has 1 vote and it requiore more 3 vote to execute
        // let add tow more vote and check status it should in requested state

        await Wallet.connect(deployer3).voteOnTrxReq(2);
        await Wallet.connect(deployer4).voteOnTrxReq(2);
        // console.log(await Wallet.connect(deployer3).getTransactionRequestUpdate(1));
        // console.log(await Wallet.connect(deployer3).getTransactionRequestUpdate(2));
        expect(balanceAfter).to.be.equal(ethers.parseEther("2"));

        // submitrequests should be revrted if more than amount of eth or token balance is 
        // passed for transaction request

        try {
            await Wallet.connect(deployer2).submitTransactionRequest(deployer9.address,ethers.ZeroAddress,ethers.parseEther("5"),2);

        } catch (error) {
                
            // console.log(error);
            expect(error);
        }



    });
    it("Token Sholud Be Transfered From Wallet And More Than tokenAMount Transfer request Should be Reverted", async()=>{
        const {Wallet,token1, token2, deployer1,deployer2,deployer3,deployer4,deployer5,tokenOwner1,tokenOwner2} = await loadFixture(deployFactoryAndCreateWalletAndTokens);
        const WalletAdd = await Wallet.getAddress();
        const tokenAdd1 = await token1.getAddress();
        const tokenAdd2 = await token2.getAddress();
        
        // transfer Some Token to The Wallet
        await token1.connect(tokenOwner1).transfer(WalletAdd,100);
        await token2.connect(tokenOwner2).transfer(WalletAdd,100);
        expect(await token1.connect(deployer1).balanceOf(WalletAdd)).to.be.equal(100);
        expect(await token2.connect(deployer1).balanceOf(WalletAdd)).to.be.equal(100);

        const{deployer7,deployer8} = await accounts.getAccounts();
        // submit Token Transfer request
        await Wallet.connect(deployer2).submitTransactionRequest(deployer7.address,tokenAdd1,80,1);

        // Vote on tranfer request

        await Wallet.connect(deployer1).voteOnTrxReq(1);
        await Wallet.connect(deployer3).voteOnTrxReq(1);
        await Wallet.connect(deployer4).voteOnTrxReq(1);

        expect(await token1.connect(deployer1).balanceOf(WalletAdd)).to.be.equal(20);
        expect(await token1.connect(deployer7).balanceOf(deployer7.address)).to.be.equal(80);

        // As Wallet Has Balance Of 100 of Token2
        /// if We Try To submit For Tken2 tranfer of 101 it should rvert the requets
        // console.log(await Wallet.connect(deployer3).getTransactionRequestUpdate(1));

        try {
             await Wallet.connect(deployer2).submitTransactionRequest(deployer8.address,tokenAdd2,101,1);
            
        } catch (error) {
            // console.log(error);

            expect(error);
        }



        

        

    })

    /**
     * next test should be 
     * Wallet Should be able to receive ethers
     * Wallet Should be able to receive tokens
     * Wallet Sholud be Able transfer Ethers And Tokens
     * WithouT Votes No Transactions should be executedS
     * 
     */
})