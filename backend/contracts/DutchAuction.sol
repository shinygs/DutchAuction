//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.0;
import "./GLDToken.sol";

contract DutchAuction {
  //events
  event BidSubmission(address indexed sender, uint256 amount);

  //constants
  uint constant public MAX_TOKENS_SOLD = 20 * 10*18; //20 tokens
  uint constant public WAITING_PERIOD = 20 minutes;

  //storage
  GLDToken public gldToken;
  address public wallet;
  address public owner;
  uint public ceiling;
  uint public priceFactor;
  uint public startBlock;
  uint public endTime;
  uint public totalReceived;
  uint public finalPrice;
  mapping (address => uint) public bids;

  enum Stages {
    AuctionDeployed,
    AuctionSetUp,
    AuctionStarted,
    AuctionEnded,
    TradingStarted,
    TokensDistributed
  }

  Stages public current_stage;

  modifier atStage(Stages _stage) {
    require(current_stage == _stage);
    _;
  }

  struct Bid {
    uint256 price;
    uint256 transfer;
    bool placed;
    bool claimed;
    bool isBitcoin;
  }

  mapping (address => Bid) public bids2;

  modifier isOwner() {
    require(msg.sender == owner); //only owner allowed to proceed
    _;
  }

  modifier isWallet() {
    require(msg.sender == wallet); //only wallet allowed to proceed
    _;
  }

  modifier isValidPayLoad() {
    require(msg.data.length > 4 && msg.data.length < 36);
    _;
  }

  modifier timedTransactions() {
    if(current_stage == Stages.AuctionStarted && calcTokenPrice() <= calcStopPrice()){
      finalizeAuction();
    }
    if(current_stage == Stages.AuctionEnded && now > endTime + WAITING_PERIOD){
      current_stage = Stages.TradingStarted;
      _;
    }
  }

  constructor(address _wallet, uint _ceiling, uint _priceFactor) public{
    if (_wallet == 0x0 || _ceiling == 0x0 || _priceFactor == 0x0){
      revert();
    }
    owner = msg.sender;
    wallet = _wallet;
    ceiling = _ceiling;
    priceFactor = _priceFactor;
    current_stage = Stages.AuctionDeployed;
  }

  function setup (address _gldToken) public isOwner atStage(Stages.AuctionDeployed){
    if(_gldToken == address(0x0)){
      revert();
    }
    gldToken = GLDToken(_gldToken);
    //validdate token balance
    if (GLDToken.balanceOf(_gldToken) != MAX_TOKENS_SOLD){
      revert();
    }
    current_stage = Stages.AuctionSetUp;
  }

  function startAuction() public isWallet atStage(Stages.AuctionSetUp){
    current_stage = Stages.AuctionStarted;
    startBlock = block.number;
  }

  function changeSettings(uint _ceiling, uint _priceFactor) public isWallet atStage(Stages.AuctionSetUp){
    ceiling = _ceiling;
    priceFactor = _priceFactor;
  }

  function calcCurrentTokenPrice() public timedTransactions returns (uint){
    if(current_stage == Stages.AuctionEnded || current_stage == Stages.TradingStarted){
      return finalPrice;
    }
    return calcTokenPrice();
  }

  function updateStage() public timedTransactions returns (Stages){
    return current_stage;
  }

  function bid (address receiver) public payable isValidPayLoad timedTransactions atStage(Stages.AuctionStarted) returns (uint amount){
    //if bid is done by ShapeShift, receiver address is set 
    if(receiver == address(0)){
      receiver = msg.sender;
    }
    amount = msg.value;
    // // Prevent that more than 90% of tokens are sold. Only relevant if cap not reached.
    uint maxWei = (MAX_TOKENS_SOLD / 10**18) * calcTokenPrice() - totalReceived;
    // uint maxWeiBasedOnTotalReceived = ceiling - totalReceived;
    // if (maxWeiBasedOnTotalReceived < maxWei){
    //   maxWei = maxWeiBasedOnTotalReceived;
    // }

    // //only invest maximum possible amount
    // if(amount > maxWei){
    //   amount = maxWei;
    //   // Send change back to receiver address. In case of a ShapeShift bid the user receives the change back directly.
    //     if (!receiver.send(msg.value - amount))
    //         // Sending failed
    //         throw;
    // }

    // Forward funding to ether wallet
    if (amount == 0 || !payable(wallet.address).send(amount))
      // No amount sent or sending failed
      revert();
    
    bids[receiver] += amount;
    totalReceived += amount;

    if (maxWei == amount)
      // When maxWei is equal to the big amount the auction is ended and finalizeAuction is triggered.
      finalizeAuction();

    BidSubmission(receiver, amount);
  }

  function claimTokens(address receiver) public isValidPayLoad timedTransactions atStage(Stages.TradingStarted){
    if(receiver == 0)
      receiver = msg.sender;
    uint tokenCount = bids[receiver] * 10**18 / finalPrice;
    bids[receiver] = 0;
    gldToken.transfer(receiver, tokenCount);
  }

  function calcStopPrice() view public returns(uint){
    return totalReceived * 10**18 / MAX_TOKENS_SOLD + 1;
  }

  function calcTokenPrice() view public returns(uint){
    return ceiling - priceFactor*(block.number - startBlock);
  }

  function finalizeAuction() private {
    current_stage = Stages.AuctionEnded;
    if(totalReceived == ceiling){
      finalPrice = calcTokenPrice();
    } else{
      finalPrice = calcStopPrice();
    }
    uint soldTokens = totalReceived * 10**18 / finalPrice;
    // Auction contract transfers all unsold tokens to inventory multisig
    gldToken.transfer(wallet, MAX_TOKENS_SOLD - soldTokens);
    endTime = now;
  }
}
