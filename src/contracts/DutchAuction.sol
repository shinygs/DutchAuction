pragma solidity ^0.6.0;
import "./GLDToken.sol";

contract DutchAuction {
  //events
  event BidSubmission(address indexed sender, uint256 amount, uint256 currentPrice);
  
  //constant
  //uint constant public MAX_TOKENS_SOLD = 10*10**18; // 10 Tokens
  uint constant public WAITING_PERIOD = 20 minutes;

  GLDToken public gldToken;
  address payable public wallet; // the wallet that owns the tokens at first
  address public owner; // the owner's address
  uint public startingTokenPrice; // in eth
  uint public maxTokensSold; // number of tokens put on sale
  uint public priceFactor; // decrease rate in eth
  uint public startTime;
  uint public totalReceived; //this is in wei
  uint public finalPrice; // in eth
  mapping (address => uint) public bids; // to remain the claim of each participant in wei
  Stages public stage; //current stage

  enum Stages {
      AuctionDeployed,
      AuctionSetUp,
      AuctionStarted,
      AuctionEnded,
      TradingStarted
  }

  //modifiers
  modifier atStage(Stages _stage) {
      if (stage != _stage)
          // Contract not in expected state
          revert("wrong stage");
      _;
  }

  modifier isOwner() {
      if (msg.sender != owner)
          // Only owner is allowed to proceed
          revert("owner only");
      _;
  }

  modifier isWallet() {
      if (msg.sender != wallet)
          // Only wallet is allowed to proceed
          revert("wallet only");
      _;
  }

  modifier isValidPayload() {
      if (msg.data.length != 4 && msg.data.length != 36)
          revert("not valid payload");
      _;
  }

  modifier timedTransitions() {
      if (stage == Stages.AuctionStarted && calcTokenPrice() <= calcStopPrice())
          finalizeAuction();
      if (stage == Stages.AuctionEnded && now > startTime + WAITING_PERIOD) // after 20 mins 
          stage = Stages.TradingStarted;
      _;
  }

  //functions
  /// @dev Contract constructor function sets owner.
  /// @param _wallet Gnosis GLDTokens wallet.
  /// @param _startingTokenPrice Auction starting price.
  /// @param _priceFactor Auction price factor.
  constructor(address payable _wallet, uint _numOfTokens, uint _startingTokenPrice, uint _priceFactor)
      public
  {
      if (_wallet == address(0x0) || _numOfTokens == 0 ||_startingTokenPrice == 0 || _priceFactor == 0)
          // Arguments are null.
          revert("constructor args null");
      owner = msg.sender;
      wallet = _wallet;
      maxTokensSold = _numOfTokens *10**18; // in wei
      startingTokenPrice = _startingTokenPrice; // in eth
      priceFactor = _priceFactor; // in eth
      stage = Stages.AuctionDeployed;
  }

  /// @dev Setup function sets external contracts' addresses, for this case the GLDToken.
  /// @param _gldToken Gnosis gldToken address.
  function setup(address _gldToken)
      public
      isOwner
      atStage(Stages.AuctionDeployed)
  {
      if (_gldToken == address(0x0))
          // Argument is null.
          revert("gold token address is null");
      gldToken = GLDToken(_gldToken);
      // Validate token balance
      if (gldToken.balanceOf(address(this)) != maxTokensSold) 
          revert("invalid token balance");
      stage = Stages.AuctionSetUp;
  }

  /// @dev Starts auction and sets startTime.
  function startAuction()
      public
      isWallet
      atStage(Stages.AuctionSetUp)
  {
      stage = Stages.AuctionStarted;
      startTime = now;
  }

  /// @dev Changes auction starting price and start price factor before auction is started.
  /// @param _startingTokenPrice Updated auction startingTokenPrice.
  /// @param _priceFactor Updated start price factor.
  function changeSettings(uint _startingTokenPrice, uint _priceFactor)
      public
      isWallet
      atStage(Stages.AuctionSetUp)
  {
      startingTokenPrice = _startingTokenPrice;
      priceFactor = _priceFactor;
  }

  /// @dev Calculates current token price in ETH.
  /// @return Returns token price.
  function calcCurrentTokenPrice()
      view
      public
      returns (uint)
  {
      if (stage == Stages.AuctionEnded || stage == Stages.TradingStarted)
          return finalPrice;
      return calcTokenPrice();
  }

  /// @dev Returns correct stage, even if a function with timedTransitions modifier has not yet been called yet.
  /// @return Returns current auction stage.
  function updateStage()
      public
      timedTransitions
      returns (Stages)
  {
      return stage;
  }

  /// @dev Returns startingPrice in ETH.
  /// @return Returns startingPrice in ETH.
  function getStartingPrice()
        view
        public
        returns(uint)
    {
        return startingTokenPrice;
    }

  /// @dev Returns startingPrice in ETH.
  /// @return Returns startingPrice in ETH.
  function getPriceFactor()
        view
        public
        returns(uint)
    {
        return priceFactor;
    }

  /// @dev Returns number of Tokens used in this auction.
  /// @return Returns maxTokens.
  function getMaxTokens()
        view
        public
        returns(uint)
    {
        return maxTokensSold;
    }

  /// @dev Returns number of Tokens used in this auction.
  /// @return Returns maxTokens.
  function getUserFinalTokens(address receiver)
        public
        timedTransitions
        returns(uint)
    {
        return bids[receiver]/(finalPrice * 10**18);
    }

  /// @dev Returns number of Tokens used in this auction.
  /// @return Returns maxTokens.
  function getUserExpectedTokens(address receiver)
        public
        timedTransitions
        returns(uint)
    {
        if(bids[receiver] == 0){
            return 0;
        }
        return bids[receiver]/(calcCurrentTokenPrice() * 10**18);
    }

  /// @dev Returns number current user's bidded amount
  /// @return Returns bidded amount in ETH.
  function getUserBidAmount(address receiver)
        public
        timedTransitions
        returns(uint)
    {
        if(bids[receiver] == 0){
            return 0;
        }
        return bids[receiver]/10**18;
    }

  /// @dev Allows to send a bid to the auction.
  /// @param receiver Bid will be assigned to this address if set.
  function bid(address payable receiver)
      public
      payable
      isValidPayload
      timedTransitions
      atStage(Stages.AuctionStarted)
      returns (uint amount)
  {
      // If a bid is done on behalf of a user via ShapeShift, the receiver address is set.
      if (receiver == address(0x0))
          receiver = msg.sender;
      amount = msg.value;
      uint unsoldTokens = calcUnsoldTokens();
      uint wantBuy = amount/(calcTokenPrice()*10**18); 
      // getting change
      if (amount > unsoldTokens*calcTokenPrice()*10**18) {
          uint refund = amount - unsoldTokens * calcTokenPrice()*10**18;
          if (!receiver.send(refund)){
              // Sending failed
              revert("sending change back failed");
          }
          amount = amount - refund; //to pay for the tokens
      }

      // Forward funding to ether wallet
      if (amount == 0 || !wallet.send(amount))
          // No amount sent or sending failed
          revert("sending to wallet failed");
      bids[receiver] += amount; // remember the claim of each participant in wei
      totalReceived += amount; // amount of money earned
      if (wantBuy >= unsoldTokens)
          // When maxWei is equal to the big amount the auction is ended and finalizeAuction is triggered.
          finalizeAuction();
      BidSubmission(receiver, amount, calcCurrentTokenPrice());
  }

  /// @dev Claims tokens for bidder after auction.
  /// @param receiver Tokens will be assigned to this address if set.
  function claimTokens(address receiver)
      public
      isValidPayload
      timedTransitions
      atStage(Stages.TradingStarted)
  {
      if (receiver == address(0x0))
          receiver = msg.sender;
      uint tokenCount = bids[receiver]/(finalPrice * 10**18);
      bids[receiver] = 0;
      gldToken.transfer(receiver, tokenCount * 10**18);
  }

  /// @dev Calculates stop price in ETH.
  /// @return Returns stop price.
  function calcStopPrice()
      view
      public
      returns (uint)
  {
      if((WAITING_PERIOD/60)*priceFactor >= startingTokenPrice){
          return 1;
      }
      return startingTokenPrice - (WAITING_PERIOD/60)*priceFactor;
  }

  /// @dev Calculates token price in ETH. Drops every second.
  /// @return Returns token price.
  function calcTokenPrice()
      view
      public
      returns (uint)
  {
      uint tempMinusPrice =  priceFactor * ((now - startTime)/60);
      if(tempMinusPrice >= startingTokenPrice){
          return 1;
      }
      return startingTokenPrice - tempMinusPrice;
  }

  /// @dev Return tokens not sold yet in the auction.
  /// @return returns number of tokens in the token unit
  function calcUnsoldTokens()
        view
        public
        returns (uint)
    {
        return maxTokensSold/(10**18) - totalReceived/(calcCurrentTokenPrice()*10**18) ;
    }
  
  // private function
  // Gets to final price and returns the unsold tokens back to owner
  function finalizeAuction()
      private
  {
      stage = Stages.AuctionEnded;
      if(calcTokenPrice() <= calcStopPrice()){
          finalPrice = calcStopPrice();
      }else{
          finalPrice = calcTokenPrice(); 
      }
      
      uint soldTokens = totalReceived/(finalPrice* 10**18);
      // Auction contract transfers all unsold tokens to Gnosis inventory multisig
      gldToken.transfer(wallet, maxTokensSold - soldTokens * 10**18);
      stage = Stages.TradingStarted;
  }
}