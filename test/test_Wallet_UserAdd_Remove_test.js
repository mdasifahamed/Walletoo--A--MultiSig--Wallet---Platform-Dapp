const {expect} = require('chai');
const { ethers } = require('hardhat');
const hre = require('hardhat');
const {loadFixture} = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const accounts = require('../scripts/utils/signers');


describe("Wallet Voting threshold Test",function(){

    async  function deployfactory(){
        const {factoryOwner} = await accounts.getAccounts();
        const contract = await ethers.getContractFactory("WalletFactory");
        const factory = await contract.connect(factoryOwner).deploy();
        return{factory};
    }

    it("Wallet Must be Created At List Minimum with three people Inlcuding The Wallet Creator And Voting Threshold must be less 1 than total wallet user",async()=>{
        const {factory} = await loadFixture(deployfactory);
        const {deployer1, deployer2, deployer3} = await accounts.getAccounts();

        try {
            await factory.connect(deployer1).createWallet("Fund",[])
        } catch (error) {
            
            expect(error);
           
        }
        try {
            await factory.connect(deployer1).createWallet("Fund",[deployer1.address])
        } catch (error) {
   
            expect(error);
           
        }

        try {
            /**
             * we  can't add  same user as wallet suer for twice 
             */
            await factory.connect(deployer1).createWallet("Fund",[deployer2.address,deployer2.address]);
        } catch (error) {
            
            expect(error);
        }

      try {
        /**
         * we even can't add the deployer as user twice as deployer is the by default a user
         */
        await factory.connect(deployer1).createWallet("Fund",[deployer1.address,deployer2.address]);
      } catch (error) {
      
            expect(error)
           
      }

      await factory.connect(deployer1).createWallet("Fund",[deployer2.address,deployer3.address]);

       const walletAddress = await factory.connect(deployer1).getWalletAddressById(1);
       const walletartifact = await hre.artifacts.readArtifact("Wallet");
       const Wallet = await ethers.getContractAt(walletartifact.abi, walletAddress);
        /**
         * as we added 2 member at time of deploying and the deployer  is 
         * also a user so the total member is 3 
         * as per wallet rule of M of N Signature the Voting Threshold will be at this time 
         * 3 - 1 = 2 as per our requirement. 
         */
       expect(parseInt(await Wallet.getVotingThreshOld())).to.be.equal(2)
    
    });
    it("Sholud Revert For Remove Memberrequest If The Total memebr Of Wallet is 3", async()=>{
        const {factory} = await loadFixture(deployfactory);
        const {deployer1, deployer2, deployer3} = await accounts.getAccounts();

        try {
            await factory.connect(deployer1).createWallet("Fund",[deployer2.address, deployer3.address])
        } catch (error) {
            console.log(error);
        }


       const walletAddress = await factory.connect(deployer1).getWalletAddressById(1);
       const walletartifact = await hre.artifacts.readArtifact("Wallet");
       const Wallet = await ethers.getContractAt(walletartifact.abi, walletAddress);

       try {
            await Wallet.connect(deployer1).submitUserAddOrRemoveRequest(deployer3.address,false);
        
       } catch (error) {
            /**
             * as we have only three member rigth now on the wallet we expect an error aka revert transaction
             */
           
            expect(error);

       }
       

    });
})


describe("Wallet Member Add, Remove And Vote Tests", function(){
    async function deployFactoryAndCreateWallet(){
        const {factoryOwner, deployer1,deployer2,deployer3,deployer4,
        deployer5,deployer6,deployer8} = await accounts.getAccounts();
        const contract = await ethers.getContractFactory("WalletFactory");
        const factory = await contract.connect(factoryOwner).deploy();

        try {
            await factory.connect(deployer1).createWallet("Travel Fund", [deployer2.address,deployer3,deployer4]);
        } catch (error) {
            console.log(error);
        }
        const walletAddress = await factory.connect(deployer1).getWalletAddressById(1);
        const walletartifact = await hre.artifacts.readArtifact("Wallet");
        const Wallet = await ethers.getContractAt(walletartifact.abi, walletAddress);
        return{Wallet,deployer1,deployer2,deployer3,deployer4,
            deployer5,deployer6,deployer8};

    }

    it("Only the Wallet Users Can Submit Add/Remove Request",async()=>{
        const{Wallet,deployer1,deployer2,deployer3,deployer4,deployer5,deployer8} = await loadFixture(deployFactoryAndCreateWallet);

        /**
         * From Our wallet we have added only deployer2,deployer3,deployer4
         * and deployer is the creator of the so by default he is also user
         * except them nobody can submit add or remove request
         * deployer5 is nothe wallet user he must not be able to submit add or remove request
         */

        try {
            await Wallet.connect(deployer5).submitUserAddOrRemoveRequest(deployer8.address,true);
        
        } catch (error) {
            
            expect(error);
           
        }

        try {
            await Wallet.connect(deployer5).submitUserAddOrRemoveRequest(deployer8.address,false);
        } catch (error) {
            expect(error);
        }

        /**
         * deployer 1,deployer2, deployer3, deployer4, are the wallet user
         * they should be able submit add/remove request
         */
        try {
            await Wallet.connect(deployer1).submitUserAddOrRemoveRequest(deployer8.address,true);
            await Wallet.connect(deployer2).submitUserAddOrRemoveRequest(deployer8.address,true);
            await Wallet.connect(deployer3).submitUserAddOrRemoveRequest(deployer8.address,true);
            await Wallet.connect(deployer4).submitUserAddOrRemoveRequest(deployer8.address,true);
        } catch (error) {
            console.log(error);
        }

        /**
         * as four users has sumited four our addRequest array should have four requets
         * 
         */
        
        let addReqs = await Wallet.connect(deployer1).getAllMemBerAddOrRemoveRequest();
        let numofReqs = addReqs.length;
 

        expect(numofReqs).to.be.equal(4);
    });
    it("Only Wallet Users Can Vote On Request", async()=>{
        const{Wallet,deployer1,deployer2,deployer3,deployer4,deployer5,deployer8} = await loadFixture(deployFactoryAndCreateWallet);

        try {
            await Wallet.connect(deployer2).submitUserAddOrRemoveRequest(deployer8.address,true);
            await Wallet.connect(deployer1).submitUserAddOrRemoveRequest(deployer3.address,false);
        } catch (error) {
            console.log(error);
        }
        /**
         * Wallet Users Are deployer 1,2,3,4 So Only They Can Vote On A Request
         * deployer5 is not a wallet if tries to vote it should revert the trx
         * as our first request is aadding member so request id would be for add member is 1
         * and second request is for remove so request id would be for this is 2.
         */

        try {
            await Wallet.connect(deployer5).voteOnAddOrRemoveMember(1);
        } catch (error) {
            
            expect(error);
        }

        try {
            await Wallet.connect(deployer5).voteOnAddOrRemoveMember(2);
        } catch (error) {
            
            expect(error);
        }

        /**
         * as dep1 and dep3 is wallet they can vote 
         * their transcation sholud not be reverted
         */
        expect(await Wallet.connect(deployer1).voteOnAddOrRemoveMember(1)).to.be.not.reverted;
        expect(await Wallet.connect(deployer2).voteOnAddOrRemoveMember(2)).to.be.not.reverted;

    });
    it("One Cannot Submit Add For Existing User", async()=>{
        const{Wallet,deployer1,deployer2,deployer3,deployer4} = await loadFixture(deployFactoryAndCreateWallet);

        try {
            /**
             * dep4 is already a wallet if we try add him agian it should fail
             */
            await Wallet.connect(deployer1).submitUserAddOrRemoveRequest(deployer4.address,true);
        } catch (error) {
            
            expect(error);
        }

    });
    it("Member should Be Added If Only The Voting threshold Meet",async()=>{
        const {Wallet,deployer1,deployer2,deployer3,deployer4,
            deployer5,deployer6,deployer8} = await loadFixture(deployFactoryAndCreateWallet);
        
        /**
         * As we have 4 member in the Wallet We need atleast
         * 3 votes to  Add a member
         * After The Three Vote The Sholud Be Added
         *  
         */

            
        // Add Member add request

        try {
            await Wallet.connect(deployer1).submitUserAddOrRemoveRequest(deployer6.address,true);
        } catch (error) {
            console.log(error);
        }

        let voteCount = await Wallet.connect(deployer1).getMemberAddOrRemoveVoteCount(1)
        /**
         * as we this have only one vote 
         * the request submitter is the only voter
         * and the sholud not be added.
         */
        let users = await Wallet.connect(deployer1).getAllUsers();
        users = users[0];// as getAllUsers returns tupple of users and users length
        let result = users.indexOf(deployer6.address);
        expect(result).to.be.equal(-1) 
        expect(parseInt(voteCount)).to.be.lessThan(parseInt(await Wallet.connect(deployer1).getVotingThreshOld()));

        /**
         * We Need More vote Add dep6
         * after his successful adding voting threshold should be increased by one 
         */
        let votingthresholdBefore = await Wallet.connect(deployer1).getVotingThreshOld();
    


        await Wallet.connect(deployer2).voteOnAddOrRemoveMember(1);
        await Wallet.connect(deployer3).voteOnAddOrRemoveMember(1);

        /**
         * now the member Sholud be added
         */

        voteCount = await Wallet.connect(deployer1).getMemberAddOrRemoveVoteCount(1)
        expect(parseInt(voteCount)).to.be.lte(parseInt(await Wallet.connect(deployer1).getVotingThreshOld()));
        users = await Wallet.connect(deployer1).getAllUsers();
        users = users[0];// as getAllUsers returns tupple of users and users length
        result = users.indexOf(deployer6.address);
        expect(result).to.be.not.equal(-1);
        let votingthresholdAfter = await Wallet.connect(deployer1).getVotingThreshOld();
        expect(parseInt(votingthresholdBefore)+1).to.be.equal(parseInt(votingthresholdAfter));
       
    });

    it("Member Sholud Not Be Removed Untill The Voting Threshold Met", async()=>{
        const {Wallet,deployer1,deployer2,deployer3,deployer4,
            deployer5,deployer6,deployer8} = await loadFixture(deployFactoryAndCreateWallet);
        
        // Submit A Remvoe Request
        try {
            await Wallet.connect(deployer2).submitUserAddOrRemoveRequest(deployer4.address,false);
        } catch (error) {
           console.log(error);
        }

        let voteCount = await Wallet.connect(deployer1).getMemberAddOrRemoveVoteCount(1)
        /**
         * as we this have only one vote 
         * the request submitter is the only voter
         * and the user sholud not be removed.
         */
        let users = await Wallet.connect(deployer1).getAllUsers();
        users = users[0];// as getAllUsers returns tupple of users and users length
        let result = users.indexOf(deployer4.address);
        expect(result).to.be.not.equal(-1) 
        expect(parseInt(voteCount)).to.be.lessThan(parseInt(await Wallet.connect(deployer1).getVotingThreshOld()));

        /**
         * We Need More vote to remove dep6
         * after his remove the voting threshold should be decreased by one.
         */

        let votingthresholdBefore = await Wallet.connect(deployer1).getVotingThreshOld();
        await Wallet.connect(deployer1).voteOnAddOrRemoveMember(1);
        await Wallet.connect(deployer3).voteOnAddOrRemoveMember(1);

        // One Can Only vote once 
        try {
            await Wallet.connect(deployer3).voteOnAddOrRemoveMember(1);
        } catch (error) {
     
            expect(error);
        }

        /**
         * now the member Sholud be removed
         */

       
        voteCount = await Wallet.connect(deployer1).getMemberAddOrRemoveVoteCount(1)
        expect(parseInt(voteCount)).to.be.gte(parseInt(await Wallet.connect(deployer1).getVotingThreshOld()));
        users = await Wallet.connect(deployer1).getAllUsers();
        users = users[0] // as getAllUsers return a tupple of alll theh users array and totla number of all users.
        result = users.indexOf(deployer4.address);
        expect(result).to.be.equal(-1);
        let votingthresholdAfter = await Wallet.connect(deployer1).getVotingThreshOld();
        expect(parseInt(votingthresholdBefore)-1).to.be.equal(parseInt(votingthresholdAfter));
       
    });
})

