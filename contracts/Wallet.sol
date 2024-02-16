// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {console} from "hardhat/console.sol";
import {MappLib} from "./libraries/MappLib.sol";
import {ArrayLib} from "./libraries/ArrayLib.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Wallet{
    using MappLib for mapping(address voter => mapping(uint256 => bool));

    error Wallet__AlreadyVoted(address _voter);
    error Wallet___REQUESTEALREADYEXECUTED(uint256 req_id);
    error Wallet__MinmumTwoUserRequired(uint256 _initialUsers);
    error Wallet__MemberCannotRemovedAsItDeclinesMinimumMemBerRule(uint256 _totalUser);
    error Wallet__SameUserCannotAdded();
    error Wallet__MemberNotExits(address user );
    error Wallet__INVALID_TOKEN_ADDRESS(address token );
    error Wallet__AmountExceed(uint amount);

    enum Request_State{
        Requested,
        Completed
    }
    enum ADD_OR_REMOVE_Request{
        ADD,
        REMOVE
    }
    enum TransactionType{
        TOKEN,
        ETHER
    }
    struct MemberAddOrRemoveRequset{
        uint256 requestId;
        address Member;
        address proposer;
        Request_State request_state;
        ADD_OR_REMOVE_Request requestType;

    }

    struct TransactionRequest{
        uint256 requestId;
        address to;
        address proposer;
        address token;
        uint256 amount;
        TransactionType trx_Type;
        Request_State r_State;
    }

    mapping(address user => uint256 fund) private usersToFunds;
    mapping(uint256 memberAddReqId => TransactionRequest request) private idToTransactionRequest;
    mapping(uint256 memberAddReqId => MemberAddOrRemoveRequset request) private idToMemberAddOrRemoveRequest;
    mapping(address voter => mapping(uint256 memberAddOrRemoveReqId=> bool)) private memberAddOrRemoveVotes;
    mapping(address voter => mapping(uint256 transactionRequestId=> bool)) private transactionRequestVotes;

    MemberAddOrRemoveRequset [] private memberAddOrRemoveRequests;
    TransactionRequest [] private trasactionRequests;
    uint256 private MemberAddOrRemoveRequestId;
    uint256 private TransactionRequestId;
    string private  name;
    address private deployer;
    address[] private users;
    uint256 private votingThreshold;

    
    event NewUserAdded(address indexed _user);
    event RemoveUser(address indexed _user);
    event SubmittedMemberAddOrRemoverequest(address indexed propser, address indexed Member, uint256 indexed request_Id);
    event SubmittedForTransactionRequest(address indexed proposer, address indexed to, uint256 indexed amount, uint256 requestId);
    event TransactionExecuted(uint256 indexed requestId);

    /// @notice Contructor() 
    /// @dev this contrsuctor checks some requriment that by design the wallet must be creted with atleast three user
    /// duplicate users ar not allowed. and it sets voting threshold which M of N means if there 3 member
    /// votingthreshod would be 2, for 4 members it will be 3, for 5 it will be 4. votings threshold 
    /// will be All time (total_users - 1)
    constructor(string memory _name, address[] memory _users,address _deployer){
        uint256 initialUser = _users.length;
        if(initialUser<=1){

            revert Wallet__MinmumTwoUserRequired(initialUser);
        }
        name = _name;
        deployer = _deployer;
        users.push(_deployer);
        for(uint256 i =0 ; i< initialUser;){
            users.push(_users[i]);
            i++;
        }
        votingThreshold = users.length - 1;
        if(ArrayLib.checkDulpiAddress(users)){
            revert Wallet__SameUserCannotAdded();
        }
    }

    modifier onlyWalletUser(address _user){
        require(ArrayLib.isWalletUser(msg.sender,users),"Not A Wallet User");
        _;
    }
        // @notice submitUserAddOrRemoveRequest() it add request for add/remove user also submit vote for the request
        // on behalf of the requester and updates idToMemberAddOrRemoveRequest, memberAddOrRemoveRequests,MemberAddOrRemoveRequestId state variable.
        // @dev ArrayLib.isWalletUser() is libray function to which an array and address to ckeck if the givers adrress existin the array or not
        // if The Total member of The Wallet is 3 There then No one Can Submit User remove Request.
        // @param '_user' is a address type parameter which address is requested to add or remove.
        // @param 'requestType' is a bool type parameter if true passed then the request type would be ADD requset if False Then it Will be Remove Request
        // @inheritdoc	Copies all missing tags from the base function (must be followed by the contract name)

    function submitUserAddOrRemoveRequest(address _user,bool requestType) public onlyWalletUser(msg.sender){

        MemberAddOrRemoveRequestId = MemberAddOrRemoveRequestId +1;
        MemberAddOrRemoveRequset memory member;
        member.requestId = MemberAddOrRemoveRequestId;
        member.Member = _user;
        member.proposer= msg.sender;
        member.request_state = Request_State.Requested;
        if(requestType){
            if(ArrayLib.isWalletUser(_user,users)){
                revert Wallet__SameUserCannotAdded();
            }
            member.requestType = ADD_OR_REMOVE_Request.ADD;
            
        }else{
            uint256  totalUsers = users.length;
            if(totalUsers==3){
                revert Wallet__MemberCannotRemovedAsItDeclinesMinimumMemBerRule(totalUsers);
            }
            if(!ArrayLib.isWalletUser(_user, users)){
                revert Wallet__MemberNotExits(_user);
            }
            member.requestType = ADD_OR_REMOVE_Request.REMOVE;
        }

        idToMemberAddOrRemoveRequest[MemberAddOrRemoveRequestId] = member;
        memberAddOrRemoveRequests.push(member);
        voteOnAddOrRemoveMember(MemberAddOrRemoveRequestId);
        emit SubmittedMemberAddOrRemoverequest(msg.sender, _user, MemberAddOrRemoveRequestId);
    }
    // @notice voteOnAddOrRemoveMember() is a voting fucntoion tales request id to vote on request if the votingthreshold 
    // reaches for a specicifc voting request and updates memberAddOrRemoveVotes state varibale.
    // then it call addUser()/removeUser() to completed the request.
    // @dev MappLib.checkVote() is Libray funftion which take mapping, requestId, the address of requester address to check if the
    // request is already voted or not and return bool i.e true/false. 
    // MappLib.countVotes() is also  librayr fucntion which also takes a mppping an array of the users and ther request Id
    // to count how many votes a request has gotten.
    // @param _requestId a parameter of uint256 which is the id of request that need to be voted.

    function voteOnAddOrRemoveMember(uint256 _requestId) public onlyWalletUser(msg.sender){
        if(MappLib.checkVote(memberAddOrRemoveVotes, _requestId, msg.sender)){
            revert Wallet__AlreadyVoted(msg.sender);
        }
        memberAddOrRemoveVotes[msg.sender][_requestId] = true;

        if(MappLib.countVotes(memberAddOrRemoveVotes, users, _requestId)>= votingThreshold){
            MemberAddOrRemoveRequset memory newMember = idToMemberAddOrRemoveRequest[_requestId];
            if(newMember.requestType == ADD_OR_REMOVE_Request.ADD){
                addUser(_requestId);
            }else{
                removeUser(_requestId);
            }
        
        }
    }

    // @notice addUser() is fucntion that add user to the wallet by updtaing the users array
    // and also update the reuest to state to completetd of a request, it
    // also updates the votingthreshold as new member is added.
    // @dev Explain to a developer any extra details
    // @param _requestId a parameter uint256 type which the id of reqeust is used to to get the user addredd from the
    // mapping to add that member from the struct.

    function addUser(uint256 _requestId) private {
        MemberAddOrRemoveRequset memory newMember = idToMemberAddOrRemoveRequest[_requestId];
        if(newMember.request_state == Request_State.Completed){
            revert Wallet___REQUESTEALREADYEXECUTED(_requestId);
        }
        newMember.request_state = Request_State.Completed;
        idToMemberAddOrRemoveRequest[_requestId] = newMember;
        users.push(newMember.Member);
        emit NewUserAdded(newMember.Member);
        votingThreshold = votingThreshold +1 ;
    }

    // @notice removeUser() is fucntion that remove user to the wallet by updtaing the users array
    // and also update the reuest to state to completetd of a request, it
    // also updates the votingthreshold as a member is removed.
    // @dev Explain to a developer any extra details
    // @param _requestId a parameter uint256 type which the id of reqeust is used to to get the user addredd from the
    // mapping to add that member from the struct.  

    function removeUser(uint256 _requestId) private onlyWalletUser(msg.sender){
        MemberAddOrRemoveRequset memory newMember = idToMemberAddOrRemoveRequest[_requestId];
        if(newMember.request_state == Request_State.Completed){
            revert Wallet___REQUESTEALREADYEXECUTED(_requestId);
        }
        uint256 index = ArrayLib.getUserIndex(newMember.Member,users);
        if(index != 0){
            users[index]= users[users.length - 1];
            users.pop();
            newMember.request_state = Request_State.Completed;
            idToMemberAddOrRemoveRequest[_requestId] = newMember;
            emit RemoveUser(newMember.Member);
            votingThreshold = votingThreshold -1;
        }

    }

    // @notice submitTransactionRequest() is used to submit request for trasaction which submit and vote 
    // for on behalf of the requeter and updates TransactionRequestId,trasactionRequests,idToTransactionRequest state variables
    // @dev isToken() is fucntion that chekc for contract address
    // IERC20() is the interface of erc20 token imported from openzeppelin.
    // @param _to address to whom fund/token will sent, _token address of token which will be transfered,
    // _amount how much fund/token need to be transfered, req_type determines is it ther transfer or token trasnfer
    // After SuccessFull Submmiting I Call To To vote The Request.

    function submitTransactionRequest(address _to, address _token, uint256 _amount, uint8 req_type)public onlyWalletUser(msg.sender){
    
        TransactionRequestId = TransactionRequestId +1;
        TransactionRequest memory trxreq;
        trxreq.requestId = TransactionRequestId;
        trxreq.proposer = msg.sender;
        trxreq.to = _to;
        trxreq.amount = _amount;
        trxreq.r_State = Request_State.Requested;            
        if(req_type==1){
            if((_token != address(0)) && isToken(_token)){
                if( _amount >=IERC20(_token).balanceOf(address(this))){
                    revert Wallet__AmountExceed(_amount);
                }
                trxreq.trx_Type = TransactionType.TOKEN;
                trxreq.token = _token;
            }else{
                revert Wallet__INVALID_TOKEN_ADDRESS(_token);
            }

        } else if(req_type==2){
            if(_amount >= address(this).balance){
                revert Wallet__AmountExceed(_amount);
            }
            trxreq.trx_Type = TransactionType.ETHER;
            trxreq.token = _token;

        }else{
            revert("invalid transaction request");
        }
        trasactionRequests.push(trxreq);
        idToTransactionRequest[trxreq.requestId] = trxreq;
        voteOnTrxReq(trxreq.requestId);
        emit SubmittedForTransactionRequest(trxreq.proposer, trxreq.to, trxreq.amount, trxreq.requestId);
    }

    // @notice voteOnTrxReq() for trasantion request and upates transactionRequestVotes.
    // @dev MappLib.checkVote() is Libray funftion which take mapping, requestId, the address of requester address to check if the
    // request is already voted or not and return bool i.e true/false. 
    // MappLib.countVotes() is also  librayr fucntion which also takes a mppping an array of the users and ther request Id
    // to count how many votes a request has gotten.
    // @param req_Id a parameter of uint256 which is request id of a trxRequest and need votes 
    // @return on successfull vote it calls executeTrx() for ether transfer and for token transfer it use IERC20().transfer().
    // And Updates request State.

    function voteOnTrxReq(uint256 req_Id) public onlyWalletUser(msg.sender)  {
         if(MappLib.checkVote(transactionRequestVotes, req_Id, msg.sender)){
            revert Wallet__AlreadyVoted(msg.sender);
        }
        transactionRequestVotes[msg.sender][req_Id] = true;
        if(MappLib.countVotes(transactionRequestVotes, users, req_Id)>= votingThreshold){
            TransactionRequest memory trxreq = idToTransactionRequest[req_Id];
            if(trxreq.trx_Type == TransactionType.TOKEN){
                
                trxreq.r_State = Request_State.Completed;
                idToTransactionRequest[req_Id] = trxreq;
                IERC20(trxreq.token).transfer(trxreq.to, trxreq.amount);
              

            }else{
                executeTrx(req_Id);
            }
        }
        emit TransactionExecuted(req_Id);
            
    }

    // @notice executeTrx () is used to transfer ether for a request 
    // @dev it uses low-level call function without data just with value to transfer ether
    // @param _reqId a parameter uint256 type to find which trxRequest to use for transfer.
    // @return a bool o successfull transfer.

    function executeTrx(uint256 _reqId) private {
        TransactionRequest memory trxreq = idToTransactionRequest[_reqId];
        if(trxreq.r_State == Request_State.Completed){
            revert Wallet___REQUESTEALREADYEXECUTED(_reqId);
        }
      
        trxreq.r_State = Request_State.Completed;
        idToTransactionRequest[_reqId] = trxreq;
        (bool success,) = payable(trxreq.to).call{value: trxreq.amount}("");
        require(success);
    }

    // fucntion to check a address which is a EOA or Contract
    function isToken(address addr) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
     
    
    function getAllUsers() public view onlyWalletUser(msg.sender) returns(address[] memory,uint256) {
        return (users,users.length);
    }

    function getVotingThreshOld() public view returns(uint256){
        return votingThreshold;
    }
   
    function getAllMemBerAddOrRemoveRequest() public view returns(MemberAddOrRemoveRequset[] memory){
        return memberAddOrRemoveRequests;
    }

    function getAllTransactioRequests() public view returns(TransactionRequest [] memory){
        return trasactionRequests;
    }

    function getMemberAddOrRemoveVoteCount(uint256 requestId) public view returns (uint256){
        return MappLib.countVotes(memberAddOrRemoveVotes, users, requestId);
    }

    function getMemberTransactionVoteCount(uint256 requestId) public view returns (uint256){
        return MappLib.countVotes(transactionRequestVotes, users, requestId);
    }
    function getUserFundedAmount(address _user) public view returns(uint256){
        return usersToFunds[_user];
    }
    function getTransactionRequestUpdate(uint256 _reqId) public view returns(TransactionRequest memory){
        return idToTransactionRequest[_reqId];
    }
    // Only The Wallet User Can Send Fund To this Wallet Not Others
    receive() external payable onlyWalletUser(msg.sender) {
        usersToFunds[msg.sender]+=msg.value;
    }

}