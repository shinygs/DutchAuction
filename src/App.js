import React, { useCallback } from "react";
import "./App.css";
import Web3 from "web3";
import Navbar from './Navbar'
import Popup from './Popup'
import Button from 'react-bootstrap/Button';
import AuctionApp from "./AuctionApp";
import { DUTCH_AUCTION_ADDRESS, DUTCH_AUCTION_ABI } from './config';
import FormGroup from "react-bootstrap/FormGroup";
import Spinner from "react-bootstrap/Spinner";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";
import Modal from "react-bootstrap/Modal";
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentStage: "Loading status...",
      dutchAuctionAdd: "",
      currentAccount: '0x0',
      setUpString: '',
      currentPerTokenPrice: "0", //in ETH
      startingPrice: "",
      priceFactor: "",
      unsoldTokens: "0",
      maxTokens: "0",
      userFinalTokens: "0",
      userExpectTokens: "0",
      userBidAmount: "0", //in ETH

      haveDutchAddress: false,
      renderSession: true,
      showClearancePricePopUp: false,
      loading: true,
      showClaimTokens: false,
      auctionStarted: false
    };
    this.loadSmartContract = this.loadSmartContract.bind(this)

    this.getPrice = this.getPrice.bind(this)
    this.getMaxNumOfTokens = this.getMaxNumOfTokens.bind(this)
    this.getRemainingTokens = this.getRemainingTokens.bind(this)
    this.getUserFinalTokens = this.getUserFinalTokens.bind(this)
    this.getUserExpectedTokens = this.getUserExpectedTokens.bind(this)
    this.getUserBidAmount = this.getUserBidAmount.bind(this)
    this.getStartPandPFactor = this.getStartPandPFactor.bind(this)

    this.setUpGLDToken = this.setUpGLDToken.bind(this)
    this.startAuction = this.startAuction.bind(this)
    this.bid = this.bid.bind(this)
    this.claimTokens = this.claimTokens.bind(this);
    this.updateStage = this.updateStage.bind(this)

    this.handleSetUpStrChange = this.handleSetUpStrChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clickStartAuctionHandler = this.clickStartAuctionHandler.bind(this);
    this.clickClaimTokenHandler = this.clickClaimTokenHandler.bind(this);
    this.clickLeaveAuctionHandler = this.clickLeaveAuctionHandler.bind(this);
    this.handleDAddChange = this.handleDAddChange.bind(this);
    this.clickSubmitDAddHandler = this.clickSubmitDAddHandler.bind(this);
    this.clickCloseHandler = this.clickCloseHandler.bind(this);
    this.handleChangeInStartP = this.handleChangeInStartP.bind(this);
    this.handleChangeInPF = this.handleChangeInPF.bind(this);
    this.handleSubmitChange = this.handleSubmitChange.bind(this);
    console.log("end of constructor")
  }

  componentDidMount() {
    //updates auction status, gets max number of tokens and remaining tokens every second
    this.updateStageInterval = setInterval(this.updateStage.bind(this), 1000)
    this.getMaxNumOfTokensInterval = setInterval(this.getMaxNumOfTokens.bind(this), 1000)
    this.getRemainingTokens = setInterval(this.getRemainingTokens.bind(this), 1000)
    this.getUserExpectedTokensInterval = setInterval(this.getUserExpectedTokens.bind(this), 1000)
    this.getUserBidAmountInterval = setInterval(this.getUserBidAmount.bind(this), 1000)
  }

  componentWillUnmount() {
    // end updating
    // clearInterval = setInterval(this.updateStage);
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = window.web3
    this.setState({ web3 })
    const accounts = await web3.eth.getAccounts()
    console.log("accounts " + accounts)
    this.setState({ currentAccount: accounts[0] })
    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    this.setState({ loading: false })
    console.log("End of Load Data")
  }

  async loadSmartContract() {
    this.setState({ loading: true })
    const dutchAuction = new this.state.web3.eth.Contract(DUTCH_AUCTION_ABI, this.state.dutchAuctionAdd)
    this.setState({ dutchAuction })
    console.log("Dutch Auction smart contract")
    console.log(dutchAuction)
    this.setState({ loading: false })
    this.setState({ haveDutchAddress: true });
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
      window.ethereum.on("accountsChanged", accounts => {
        console.log("current account: " + accounts[0])
        this.setState({ currentAccount: accounts[0] });
      });
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  //get current bidding price per token 
  async getPrice() {
    let tempPrice = await this.state.dutchAuction.methods.calcCurrentTokenPrice().call() //call() method from contract does not need gas
    console.log("current price = " + tempPrice)
    this.setState({ currentPerTokenPrice: tempPrice })
  }

  // gets number of tokens available for sale
  async getMaxNumOfTokens() {
    if (this.state.dutchAuction == undefined) { //to prevent an error message when starting app
      return;
    }
    let maxTtemp = await this.state.dutchAuction.methods.getMaxTokens().call();
    console.log("maxTtemp: " + maxTtemp); //in wei
    let maxTtempETH = maxTtemp / 10 ** 18; //change to GLD
    this.setState({ maxTokens: maxTtempETH });
    console.log("maxTokens: " + this.state.maxTokens);
  }

  //gets remaining tokens not sold
  async getRemainingTokens() {
    if (this.state.dutchAuction == undefined) { //to prevent an error message when starting app
      return;
    }
    let tempUSTokens = await this.state.dutchAuction.methods.calcUnsoldTokens().call();
    console.log("tempUSTokens: " + tempUSTokens);
    this.setState({ unsoldTokens: tempUSTokens });
  }

  //gets user's final tokens amount
  async getUserFinalTokens() { //not shown yet
    console.log("called getUserFinalTokens");
    let finalT = await this.state.dutchAuction.methods.getUserFinalTokens(this.state.currentAccount).call();
    console.log("final tokens: " + finalT);
    this.setState({ userFinalTokens: finalT });
  }

  //gets user's expected tokens amount
  async getUserExpectedTokens() {
    if (this.state.dutchAuction == undefined) { //to prevent an error message when starting app
      return;
    }
    console.log("called getUserExpetedTokens");
    let expectT = await this.state.dutchAuction.methods.getUserExpectedTokens(this.state.currentAccount).call();
    console.log("expected tokens: " + expectT);
    this.setState({ userExpectTokens: expectT });
  }

  //gets user's bidded amount in ETH
  async getUserBidAmount() {
    if (this.state.dutchAuction == undefined) { //to prevent an error message when starting app
      return;
    }
    console.log("called getUserBidAmount");
    let amountTemp = await this.state.dutchAuction.methods.getUserBidAmount(this.state.currentAccount).call();
    console.log("bidded amount: " + amountTemp);
    this.setState({ userBidAmount: amountTemp });
  }

  //gets dutch auction starting price in ETH
  async getStartPandPFactor() {
    console.log("called getStartPandPFactor");
    let spTemp = await this.state.dutchAuction.methods.getStartingPrice().call();
    let pfTemp = await this.state.dutchAuction.methods.getPriceFactor().call();
    console.log("starting price: " + spTemp);
    console.log("starting price: " + spTemp);
    this.setState({ startingPrice: spTemp });
    this.setState({ priceFactor: pfTemp });
  }

  //updates auction status
  async updateStage() {
    var stages = ["Auction needs setting up", "Auction not started", "Auction is ongoing", "Auction ended", "Claim your tokens", "Auction not deployed"]
    if (this.state.dutchAuction == undefined) { //to prevent an error message when starting app
      return;
    }
    let stageIndex = await this.state.dutchAuction.methods.updateStage().call()
    console.log("stageIndex: " + stageIndex + " stage: " + stages[parseInt(stageIndex)])
    if (stageIndex != undefined) {
      console.log("Changing current stage")
      this.setState({ currentStage: stages[parseInt(stageIndex)] })
    } else {
      console.log("Unable to retrieve stage. Please check your contracts.")
      this.setState({ currentStage: "Status invalid" })
    }
    console.log("End of UpdateStage, stage has been changed to " + this.state.currentStage)
  }

  // Setting up the auction by specifying the use of GLDTokens
  async setUpGLDToken() {
    console.log("set up")
    await this.state.dutchAuction.methods.setup(this.state.setUpString).send({ from: this.state.currentAccount }) // send() methods requires gas and are able to send ETH
    console.log("just after setup")
  }

  // Changing the starting per token price and price factor
  async changeSettings(newStartingTokenPrice, newPriceFactor) {
    console.log("changing settings")
    await this.state.dutchAuction.methods.changeSettings(parseInt(newStartingTokenPrice), parseInt(newPriceFactor)).send({ from: this.state.currentAccount })
    console.log("changed settings")
  }

  //starts the dutch auction session
  async startAuction() {
    console.log("started auction")
    let bool = await this.state.dutchAuction.methods.startAuction().send({ from: this.state.currentAccount }) // comment these lines to edit without needing to start an auction
    console.log("bool: " + bool) // comment these lines to edit without needing to start an auction
    this.setState({ auctionStarted: bool }) // comment these lines to edit without needing to start an auction
    // this.setState({ auctionStarted: true }) // uncomment this line to edit UI without needing to start an auction
    console.log("this.state.auctionStarted: " + this.state.auctionStarted)
    if (this.state.auctionStarted) {
      // change page to auction app
      this.setState({ renderSession: !this.state.renderSession })
      console.log("to auction app")
    }
  }

  // Bid for tokens with an amount (in ETH)
  async bid(bidAmountInput) {
    console.log("Amount bidded : " + bidAmountInput);
    var valueETHint = parseFloat(bidAmountInput); // in wei
    console.log("Amount bidded2 : " + valueETHint) // in ETH
    await this.state.dutchAuction.methods.bid(this.state.currentAccount).send({ from: this.state.currentAccount, value: valueETHint * 10 ** 18 })
    console.log("bidded")
  }

  // Claims Tokens based on user's account address
  async claimTokens() {
    await this.state.dutchAuction.methods.claimTokens(this.state.currentAccount).send({ from: this.state.currentAccount })
    console.log("claimedTokens")
  }

  togglePopup() {
    this.setState({
      showClearancePricePopUp: !this.state.showClearancePricePopUp
    });
  }

  handleSetUpStrChange(event) { // handler when there's a change in input for GLDToken address
    this.setState({ setUpString: event.target.value });
  }

  handleSubmit(event) { // handler gives alert message for GLDToken text input
    var bool = window.confirm("Confirm to set up token with address:\n" + this.state.setUpString);
    if (bool) {
      this.setUpGLDToken();
    }
    event.preventDefault();
  }

  clickStartAuctionHandler() { //click handler for start auction button
    if (this.state.renderSession) {
      this.startAuction()
    }
    else {
      // this.setState({showClearancePricePopUp: !this.state.showClearancePricePopUp})
      this.togglePopup()
      this.setState({
        showClaimTokens: !this.state.showClaimTokens
      });
    }
  }

  clickLeaveAuctionHandler() {
    let bool = window.confirm("Confirm leave session?\nYou will not be able to come back.");
    if (bool) {
      this.setState({ renderSession: !this.state.renderSession });
    }
  }

  clickClaimTokenHandler(event) {
    let bool = window.confirm("Claim tokens?"); // confirmation
    if (bool) {
      this.claimTokens();
    }
    event.preventDefault();
  }

  handleDAddChange(event) {
    this.setState({ dutchAuctionAdd: event.target.value });
  }

  clickSubmitDAddHandler(event) {
    if (this.state.dutchAuctionAdd == "") {
      alert("You did not input an address!");
    }
    else {
      let bool = window.confirm("Confirm Address to be\n" + this.state.dutchAuctionAdd);
      if (bool) {
        this.loadSmartContract();
      }
    }
    event.preventDefault();
  }

  clickCloseHandler() {
    if (this.state.dutchAuctionAdd == "") {
      alert("You did not enter an address!");
    }
  }

  handleChangeInStartP(event) {
    this.setState({ startingPrice: event.target.value });
  }

  handleChangeInPF(event) {
    this.setState({ priceFactor: event.target.value });
  }

  handleSubmitChange(event) {
    let bool = window.confirm("Confirm changes?\nStarting Price: " + this.state.startingPrice + " ETH\nPrice Factor: " + this.state.priceFactor + " ETH");
    if (bool) {
      this.changeSettings(this.state.startingPrice, this.state.priceFactor);
    }
    event.preventDefault();
  }

  render() {
    const alignmentStyle = {
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    };
    const buttonStyle = {
      margin: "30px"
    };
    return (
      <div className='body_with_nav'>
        <Navbar account={this.state.currentAccount} />
        <div className='body'>
          {this.state.loading ?
            <div>
              <div style={alignmentStyle}>
                <h4 style={{ marginTop: 30 }}>The sun is rising... <br />Please open Ganache</h4>
              </div>
              <div style={alignmentStyle}>
                <Spinner animation="grow" variant="warning" role="status" style={{ marginTop: 90 }}>
                  <span className="sr-only">Loading...</span>
                </Spinner>
              </div>
            </div>
            :
            this.state.renderSession ?
              <div>
                <Modal show={!this.state.haveDutchAddress} backdrop="static" keyboard={false} centered={true} size="lg">
                  <Modal.Header>
                    <Modal.Title>Welcome to Thy Dutch Auction!</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>To start the application, please provide a Dutch Auction Address.<br />
                    <input type="text" style={{ width: "100%" }} value={this.state.dutchAuctionAdd} onChange={this.handleDAddChange} placeholder="Enter Duction Auction address here"></input>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={this.clickCloseHandler}>Close</Button>
                    <Button variant="primary" onClick={this.clickSubmitDAddHandler}>Submit</Button>
                  </Modal.Footer>
                </Modal>
                <FormGroup style={alignmentStyle}>
                  <div className="w-50 p-3 mb-2 bg-white border border-primary rounded">
                    <Alert variant="primary" className="text-dark font-weight-bold"><h3>Set up auction</h3></Alert>
                    <div className="form-group">
                      <label><h5>Enter GLD Token Address: </h5></label>
                      <input type="text" className="form-control" value={this.state.setUpString} onChange={this.handleSetUpStrChange} placeholder="Enter Gold Token address here"></input>
                    </div>
                    <Button type="submit" onClick={this.handleSubmit} variant="primary">Submit Address</Button>
                  </div>
                </FormGroup>
                <div style={alignmentStyle}>
                  <Alert variant="info" className="text-center font-weight-bold">Auction Status: {this.state.currentStage}</Alert>
                </div>
                <div style={alignmentStyle}>
                  <Button variant="primary" style={buttonStyle} onClick={this.clickStartAuctionHandler}>Start Auction</Button>
                  <Button variant="primary" style={buttonStyle} onClick={this.clickClaimTokenHandler}>Claim My Tokens!</Button>
                </div>
                <Accordion style={{ width: "50%", marginLeft: "315px" }}>
                  <Card>
                    <Card.Header>
                      <Accordion.Toggle as={Button} variant="primary" eventKey="0" onClick={this.getStartPandPFactor}>Setttings</Accordion.Toggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey="0">
                      <FormGroup>
                        <div className="w-90 p-3 mb-2 bg-white">
                          <div className="form-group">
                            <label><h5>Current Starting Price Per Token (in ETH):</h5></label>
                            <input type="number" className="form-control" value={this.state.startingPrice} onChange={this.handleChangeInStartP} min="0"></input>
                          </div>
                          <div className="form-group">
                            <label><h5>Current Price Factor (in ETH):</h5></label>
                            <input type="number" className="form-control" value={this.state.priceFactor} onChange={this.handleChangeInPF} min="0"></input>
                          </div>
                          <Button type="submit" onClick={this.handleSubmitChange} variant="primary">Change</Button>
                        </div>
                      </FormGroup>
                    </Accordion.Collapse>
                  </Card>
                </Accordion>
                <div>
                  <Badge pill variant="info" style={{ marginLeft: 900 }}><i>by SLS</i></Badge>
                </div>
              </div >
              :
              <div>
                <AuctionApp
                  /*pass functions to AuctionApp*/
                  getPrice={this.getPrice}
                  bid={this.bid}
                  /*pass variables to AuctionApp*/
                  currentPerTokenPrice={this.state.currentPerTokenPrice}
                  currentStage={this.state.currentStage}
                  maxTokens={this.state.maxTokens}
                  unsoldTokens={this.state.unsoldTokens}
                  userExpectTokens={this.state.userExpectTokens}
                  userBidAmount={this.state.userBidAmount}
                />
                <div>
                  <Button variant="danger" style={buttonStyle} onClick={() => this.clickLeaveAuctionHandler()}>Leave Auction</Button>
                </div>
              </div>
          }
          {this.state.showClearancePricePopUp ? <Popup text={'At Clearance price:' + this.state.currentPerTokenPrice + 'ETH per token'} closePopup={this.togglePopup.bind(this)} /> : null}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {this.state.showClaimTokens ?
              <Button
                onClick={this.clickClaimTokenHandler}>
                Claim My Tokens!
            </Button>
              : null}
          </div>
          {console.log(this.state.renderSession)}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fillOpacity="1" d="M0,128L48,160C96,192,192,256,288,250.7C384,245,480,171,576,165.3C672,160,768,224,864,218.7C960,213,1056,139,1152,122.7C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>
      </div >
    );
  }
}

export default App;
