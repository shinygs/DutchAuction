import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import Web3 from "web3";
import Navbar from './Navbar'
import Popup from './Popup'
import SelectSession from "./SelectSession"
import Button from 'react-bootstrap/Button'
// import { Link } from 'react-router';
import AuctionApp from "./AuctionApp";
import { DUTCH_AUCTION_ADDRESS, DUTCH_AUCTION_ABI } from './config';

import { BrowserRouter, Route, Switch, NavLink, Link } from 'react-router-dom';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentAccount: '0x0',
      renderSession: true,
      showClearancePricePopUp: false,
      current_price: "",
      tokens_remaining: "0",
      loading: true,
      set_up_string: '',
      showClaimTokens: false,
      auctionStarted: false,
      maxTokens: "0",
      currentStage: "No Status"
    };
    this.getPrice = this.getPrice.bind(this)
    this.setUp = this.setUp.bind(this)
    this.startAuction = this.startAuction.bind(this)
    this.bid = this.bid.bind(this)
    this.updateStage = this.updateStage.bind(this)
    // this.getStage = this.getStage.bind(this)
    this.getMaxNumOfTokens = this.getMaxNumOfTokens.bind(this)
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.clickClaimTokenHandler = this.clickClaimTokenHandler.bind(this);
    this.claimTokens = this.claimTokens.bind(this);
    this.onClickUpdateStage = this.onClickUpdateStage.bind(this);
    console.log("end of constructor")
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const web3 = window.web3
    this.setState({ web3 })
    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    this.setState({ currentAccount: accounts[0] })
    const dutchAuction = new web3.eth.Contract(DUTCH_AUCTION_ABI, DUTCH_AUCTION_ADDRESS)
    this.setState({ dutchAuction })
    console.log("dutchau smart contract")
    console.log(dutchAuction)
    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    this.setState({ loading: false })
    console.log("End of Load Data")
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
      // window.ethereum.on('accountsChanged', function (accounts) {
      //   console.log("currentAccount" + accounts)
      //   this.setState({currentAccount:accounts[0]})
      // })
      window.ethereum.on("accountsChanged", accounts => {
        console.log("current account: " + accounts[0])
        this.setState({ currentAccount: accounts[0] });
      });
      // window.ethereum.on('accountsChanged', function () { //doesnt work
      //   window.web3.eth.getAccounts(function (error, accounts) {
      //     console.log("currently: " + accounts[0])
      //     this.setState({ currentAccount: accounts[0] });
      //   });
      // });
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async getPrice() { //get latest price
    console.log(this.state.dutchAuction)
    let current_price = await this.state.dutchAuction.methods.calcCurrentTokenPrice().call()
    console.log("current price = " + current_price)
    this.setState({ current_price })
  }

  async updateStage() { //updates the stage
    var stages = ["Auction needs setting up", "Auction not started", "Auction is ongoing", "Auction ended", "Claim your tokens", "Auction not deployed"]
    let stageIndex = await this.state.dutchAuction.methods.updateStage().call()
    // console.log("updateStage called " + stageIndex)
    console.log("stageIndex: " + stageIndex + " stage: " + stages[parseInt(stageIndex)])
    if (stageIndex != "undefined") {
      console.log("here")
      this.setState({ currentStage: stages[parseInt(stageIndex)] })
    } else {
      console.log("hererere")
      this.setState({ currentStage: "No Status" })
    }
    console.log("getStage: " + this.state.currentStage)
  }

  // async getStage() { // not used
  //   let stageIndex = await this.state.dutchAuction.stage
  //   var stages = ["Auction needs setting up", "Auction not started", "Auction is ongoing", "Auction ended", "Claim your tokens"]
  //   console.log("stageIndex: " + stageIndex + " stage: " + stages[parseInt(stageIndex)])
  //   if (stages[parseInt(stageIndex) != "undefined"]) {
  //     console.log("here")
  //     this.setState({ currentStage: stages[parseInt(stageIndex)] })
  //   }else{
  //     console.log("hererere")
  //     this.setState({currentStage: "No Status"})
  //   }
  //   console.log("getStage: " + this.state.currentStage)
  // }

  async setUp() {
    console.log("set up")
    //set up param is gold token address
    await this.state.dutchAuction.methods.setup(this.state.set_up_string).send({ from: this.state.currentAccount })
    console.log("just after setup")
    //await this.state.dutchAuction.methods.setup("0x9D78534Dc5d9D7Ee844dCcB90c8616F6D15B6883").send({ from: this.state.currentAccount })
  }

  async startAuction() { // starts auction
    // this.state.auctionStarted = await this.state.dutchAuction.methods.startAuction().send({ from: this.state.currentAccount })
    this.state.auctionStarted = true
    console.log("this.state.auctionStarted: " + this.state.auctionStarted)
    if (this.state.auctionStarted) { //change page
      this.setState({ renderSession: !this.state.renderSession })
      console.log("to auction app")
    }
    console.log("started auction")
  }

  async getMaxNumOfTokens() { // gets number of tokens deployed
    let maxTtemp = await this.state.dutchAuction.maxTokensSold;
    this.setState({ maxTokens: maxTtemp });
    console.log("maxTokens: " + this.state.maxTokens);
  }

  async bid(bidAmountInput) { //bidding function
    console.log("Amount bidded : " + bidAmountInput);
    var valueETHint = parseInt(bidAmountInput);
    console.log("Amount bidded2 : " + valueETHint)
    await this.state.dutchAuction.methods.bid(this.state.currentAccount).send({ from: this.state.currentAccount, value: valueETHint * 10 ** 18 })
    console.log("bidded")
  }

  async claimTokens() { //claims tokens
    await this.state.dutchAuction.methods.claimTokens(this.state.currentAccount).send({ from: this.state.currentAccount })
    console.log("claimedTokens")
  }

  onClickUpdateStage() { //onClickHandler for update stage
    this.updateStage()
  }

  togglePopup() {
    this.setState({
      showClearancePricePopUp: !this.state.showClearancePricePopUp
    });
  }

  clickClaimTokenHandler(event) {
    alert("Claiming Tokens");
    this.claimTokens();
    event.preventDefault();
  }

  clickHandler() { //click handler for start auction button
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
    // console.log("this.state.auctionStarted: " + this.state.auctionStarted)
    // if(this.state.auctionStarted){ //change page
    //   this.setState({ renderSession: !this.state.renderSession })
    //   console.log("hello")
    //   if (!this.state.renderSession) {
    //     // this.setState({showClearancePricePopUp: !this.state.showClearancePricePopUp})
    //     this.togglePopup()
    //     this.setState({
    //       showClaimTokens: !this.state.showClaimTokens
    //     });
    //   }
    // }
    //this.startAuction()
    // else{
    //   ReactDOM.unmountComponentAtNode(document.getElementById('count_down'))
    // }
  }

  handleChange(event) { // handler when input change for GLDToken text input
    this.setState({ set_up_string: event.target.value });
  }

  handleSubmit(event) { // handler gives alert message for GLDToken text input
    var bool = window.confirm('setting up token with address: ' + this.state.set_up_string);
    if (bool) {
      this.setUp();
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
    const button_text = this.state.renderSession ? "Start Auction" : "End Auction";
    // if(renderSession)
    // var currentdate = new Date();
    // let current_time =  currentdate.getHours() + ":"  + currentdate.getMinutes()
    return (
      <div>
        <Navbar account={this.state.currentAccount} />
        {/* <h2 id='page_title'>Select a Session</h2>
        <div className='container'>
          <div className='card'>
            <div className="detail_container">
              <Session session_time = {current_time}/>
              {/* <h4><b>{Session.state.session_date}</b></h4>
              <p>Architect & Engineer</p> */}
        {/* <a href="/auction.html" className="btn btn-primary stretched-link">Join Auction</a> */}
        {/* <Link to="/AuctionApp">
              <button>Start Auction</button>
              
              </Link> */}
        {/* <Link to='/AuctionApp'><button onClick={onClick}>Start Auction</button></Link> */}

        {this.state.loading ?
          <div id="loader" className="text-center">
            <p className="text-center">Loading...</p>
          </div>
          :
          this.state.renderSession ?
            <div>
              <SelectSession />
              <form onSubmit={this.handleSubmit}>
                <label>
                  Set up auction, put GLDToken address:
                      <input type="text" value={this.state.set_up_string} onChange={this.handleChange} />
                </label>
                <input type="submit" value="Submit" />
              </form>
              <p>{this.state.currentStage}</p>
              <div style={alignmentStyle}>
                <Button variant="secondary" style={buttonStyle} onClick={this.onClickUpdateStage}>Check Auction Status</Button>
                <Button variant="secondary" style={buttonStyle} onClick={this.clickHandler}>{button_text}</Button>
                <Button variant="secondary" style={buttonStyle} onClick={this.clickClaimTokenHandler}> Claim My Tokens! </Button>
              </div>
            </div >
            :
            <AuctionApp
              getPrice={this.getPrice}
              bid={this.bid}
              onClickUpdateStage={this.onClickUpdateStage}
              getMaxNumOfTokens={this.getMaxNumOfTokens}

              current_price={this.state.current_price}
              currentStage={this.state.currentStage}
              maxTokens={this.state.maxTokens}
              tokens_remaining={this.state.tokens_remaining}
            />
        }

        {/* {this.state.renderSession?<SelectSession /> : null} */}
        {/* <div id="count_down"></div> */}
        {/* <SelectSession renderme={this.state.renderSession}/> */}

        { this.state.showClearancePricePopUp ? <Popup text={'At Clearance price:' + this.state.current_price + 'ETH per token'} closePopup={this.togglePopup.bind(this)} /> : null}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {this.state.showClaimTokens ?
            <Button
              onClick={this.clickClaimTokenHandler}>
              Claim My Tokens!
            </Button>
            : null}
        </div>
        {/* console.log(this.state.renderSession) */}
        { console.log(this.state.renderSession)}
        {/* <AuctionApp /> */}
        {/* <BrowserRouter history={history}>

              
              <div>
                  {/* <NavLink to="/AuctionApp">Start Auction</NavLink> */}


        {/* <Switch>
                  <Route path="/SelectSession" component={SelectSession}/>
                  <Route path="/AuctionApp" component={AuctionApp}/>
                </Switch>
              </div>  */}
        {/* </BrowserRouter> */}
        {/* </div> */}
        {/* </div> */}
        {/* </div> */}


      </div >
    );
  }
}

export default App;
