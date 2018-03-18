pragma solidity ^0.4.20;
pragma experimental ABIEncoderV2;

library VoteLib {
    
    struct Vote {
        address adr;
        uint amount; //Funds to be eligible for withdraw by the address, if the vote is successful
        uint votesFor;
        uint votesAgainst;
        bool finished; //The vote finished and there is result
        bool successful; //Indicates if the vote is positive or negative
        bool hasWithdrawn; //Indicates if the user has withdrawn the amount
        mapping(address => bool) hasVoted; //Members that have voted
    }
    
    function update(Vote storage self, address _voter, bool isVoteFor, uint _importance) public {
        if (isVoteFor) {
            self.votesFor+= _importance;
        } else {
            self.votesAgainst += _importance;
        }
        self.hasVoted[_voter] = true;
    }
    
    function checkFinished(Vote storage self, uint votesNeeded) public {
        if (self.votesFor >= votesNeeded) {
            self.finished = true;
            self.successful = true;
        } else if (self.votesAgainst >= votesNeeded) {
            self.finished = true;
            self.successful = false;
        }
    }
    
}

contract Ownable {
    
    address owner;

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
        
    function Ownable () public {
        owner = msg.sender;
    }
}

contract MemberVoting is Ownable {
    using VoteLib for VoteLib.Vote;
    
    struct Member {
        address addr;
        uint importance;
        bool isValue;
    }
    
    bool initiliazed; 
    uint totalImportance; // Sum of all importances of the members
    uint pendingFundsForWithdraw; // Sum of all funds that are pending in a vote. Prevents starting a proposal for withdraw if there are not enough funds
    mapping(address => Member) public members;
    mapping(address => VoteLib.Vote) public votes;
    
    event LogVoteCreated(address indexed adr);
    event LogVoteUpdate(address indexed adr, bool isVoteFor); 
    event LogVoteFinished (address indexed adr, bool isSuccessful);
    event LogWithdraw(address indexed adr, uint amount);
    
    modifier onlyMember {
        require(members[msg.sender].isValue);
        _;
    }
    
    modifier isInitiliazed {
        require(initiliazed);
        _;
    }
    
    modifier notInitialized {
        require(!initiliazed);
        _;
    }
    
    modifier hasEnoughFunds (uint _amount) {
        require(address(this).balance - pendingFundsForWithdraw > _amount);
        _;
    }
    
    modifier voteExists (address _adr) {
        require(votes[_adr].adr == _adr && !votes[_adr].finished);
        _;
    }
    
    modifier hasNotVoted (address _adr) {
        require(!votes[_adr].hasVoted[msg.sender]);
        _;
    }
    
    modifier isEligibleForWithdraw {
        require(votes[msg.sender].adr == msg.sender && votes[msg.sender].successful);
        require(!votes[msg.sender].hasWithdrawn);
        _;
    }
    
    function () public payable {
    }
    
    function init(address[] _members, uint[] _importance) public onlyOwner notInitialized {
        require(_members.length >= 3);
        require(_members.length == _importance.length);
        
        uint _totalImportance = 0;
        
        for (uint i = 0; i < _members.length; i++) {
            assert(_members[i] != owner);
            members[_members[i]] = Member({addr : _members[i], importance : _importance[i], isValue : true});
        }
        
        totalImportance = _totalImportance;
        initiliazed = true;
    }
    
    function propose(address _receiver, uint _amount) public isInitiliazed onlyOwner hasEnoughFunds(_amount) {
        //The address can be proposed only if there is no vote active for this address
        require(votes[_receiver].adr != _receiver || 
            (votes[_receiver].adr == _receiver && votes[_receiver].finished));
        
        votes[_receiver] = VoteLib.Vote(
            {  
                adr : _receiver,
                amount : _amount,
                votesFor : 0,
                votesAgainst : 0,
                finished : false,
                successful : false,
                hasWithdrawn : false
            });
        pendingFundsForWithdraw += _amount;
        emit LogVoteCreated(_receiver);
    }
    
    function vote(address _adr, bool isVoteFor) public isInitiliazed onlyMember voteExists(_adr) hasNotVoted(_adr) {
        votes[_adr].update(msg.sender, isVoteFor, members[msg.sender].importance);
        emit LogVoteUpdate(msg.sender, isVoteFor);
        
        votes[_adr].checkFinished(totalImportance / 2);
        if (votes[_adr].finished) {
            if (!votes[_adr].successful) {
                pendingFundsForWithdraw -= votes[_adr].amount;
            }
            emit LogVoteFinished(_adr, votes[_adr].successful);
        }
    }
    
    function withdraw () public isInitiliazed isEligibleForWithdraw {
        uint amountToWithdraw = votes[msg.sender].amount;
        
        assert(address(this).balance >= amountToWithdraw);
        msg.sender.transfer(amountToWithdraw);
        
        votes[msg.sender].hasWithdrawn = true;
        pendingFundsForWithdraw -= amountToWithdraw;
        
        emit LogWithdraw(msg.sender, amountToWithdraw);
    }
}
