pragma solidity ^0.6.0;
import "./GLDToken.sol";

contract DutchAuction {
  //events
  event BidSubmission(address indexed sender, uint256 amount);
  
  //constant
  uint constant public MAX_TOKENS_SOLD = 10 /* 10**18*/; // 10 Tokens
  uint constant public WAITING_PERIOD = 20 minutes;

  GLDToken public gldToken;
  address payable public wallet; // tokens seller
  address public owner;
  uint public startingPrice; // starting price --> how much in total that was planned to earn
  uint public priceFactor; // decrease rate
  uint public startBlock;
  uint public startTime;
  uint public endTime;
  uint public totalReceived;
  uint public finalPrice;
  mapping (address => uint) public bids;
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
      if (stage == Stages.AuctionEnded && now > endTime + WAITING_PERIOD)
          stage = Stages.TradingStarted;
      _;
  }

  //functions
  /// @dev Contract constructor function sets owner.
  /// @param _wallet Gnosis GLDTokens wallet.
  /// @param _startingPrice Auction starting price.
  /// @param _priceFactor Auction price factor.
  constructor(address payable _wallet, uint _startingPrice, uint _priceFactor)
      public
  {
      if (_wallet == address(0x0) || _startingPrice == 0 || _priceFactor == 0)
          // Arguments are null.
          revert("constructor args null");
      owner = msg.sender;
      wallet = _wallet;
      startingPrice = _startingPrice;
      priceFactor = _priceFactor;
      stage = Stages.AuctionDeployed;
  }

  /// @dev Setup function sets external contracts' addresses.
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
      if (gldToken.balanceOf(wallet) != MAX_TOKENS_SOLD) 
          revert("invalid token balance");
      stage = Stages.AuctionSetUp;
  }

  /// @dev Starts auction and sets startBlock.
  function startAuction()
      public
      isWallet
      atStage(Stages.AuctionSetUp)
  {
      stage = Stages.AuctionStarted;
      startBlock = block.number;
      startTime = now;
      //should i put a start time here?
  }

  /// @dev Changes auction starting price and start price factor before auction is started.
  /// @param _startingPrice Updated auction startingPrice.
  /// @param _priceFactor Updated start price factor.
  function changeSettings(uint _startingPrice, uint _priceFactor)
      public
      isWallet
      atStage(Stages.AuctionSetUp)
  {
      startingPrice = _startingPrice;
      priceFactor = _priceFactor;
  }

  /// @dev Calculates current token price.
  /// @return Returns token price.
  function calcCurrentTokenPrice()
      public
      timedTransitions
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
      // Prevent that more than 90% of tokens are sold. Only relevant if cap not reached.
      uint maxWei = (MAX_TOKENS_SOLD / 10**18) * calcTokenPrice() - totalReceived; // calculate how much is need to earn
      uint maxWeiBasedOnTotalReceived = startingPrice - totalReceived; // if total received is not zero --> got previous bids
      if (maxWeiBasedOnTotalReceived < maxWei)
          maxWei = maxWeiBasedOnTotalReceived;
      // Only invest maximum possible amount.
      if (amount > maxWei) {
          amount = maxWei;
          // Send change back to receiver address. In case of a ShapeShift bid the user receives the change back directly.
          if (!receiver.send(msg.value - amount))
              // Sending failed
              revert("sending failed1");
      }
      // Forward funding to ether wallet
      if (amount == 0 || !wallet.send(amount))
          // No amount sent or sending failed
          revert("sending failed2");
      bids[receiver] += amount; // remember the claim of each participant
      totalReceived += amount; // amount of money earned
      if (maxWei == amount)
          // When maxWei is equal to the big amount the auction is ended and finalizeAuction is triggered.
          finalizeAuction();
      BidSubmission(receiver, amount);
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
      uint tokenCount = bids[receiver] * 10**18 / finalPrice;
      bids[receiver] = 0;
      gldToken.transfer(receiver, tokenCount);
  }

  /// @dev Calculates stop price.
  /// @return Returns stop price.
  function calcStopPrice()
      view
      public
      returns (uint)
  {
      return totalReceived * 10**18 / MAX_TOKENS_SOLD + 1;
  }

  /// @dev Calculates token price.
  /// @return Returns token price.
  function calcTokenPrice() //shouldn't price drop with time?
      view
      public
      returns (uint)
  {
      //return priceFactor * 10**18 / (block.number - startBlock + 7500) + 1;
      return startingPrice - priceFactor /**10**18 +1*/; 
      //return startingPrice;
  }
  
  // private function
  function finalizeAuction()
      private
  {
      stage = Stages.AuctionEnded;
      if (totalReceived == startingPrice) // if total money received is still at the starting price
          finalPrice = calcTokenPrice();
      else
          finalPrice = calcStopPrice();
      uint soldTokens = totalReceived * 10**18 / finalPrice;
      // Auction contract transfers all unsold tokens to Gnosis inventory multisig
      gldToken.transfer(wallet, MAX_TOKENS_SOLD - soldTokens);
      endTime = now;
  }

  function toViewablePrice(uint longPrice)
      public
      returns(uint viewablePrice)
  {
    viewablePrice = longPrice / 1*10**18; // not accurate
  }
}