import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import Web3 from "web3";
import Navbar from './Navbar'
import Popup from './Popup'
// import SelectSession from "./SelectSession"
import Button from 'react-bootstrap/Button';
import AuctionApp from "./AuctionApp";
import { DUTCH_AUCTION_ADDRESS, DUTCH_AUCTION_ABI } from './config';
import FormGroup from "react-bootstrap/FormGroup";
import Spinner from "react-bootstrap/Spinner";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentAccount: '0x0',
      renderSession: true,
      showClearancePricePopUp: false,
      current_price: "0",
      tokens_remaining: "0",
      loading: true,
      set_up_string: '',
      showClaimTokens: false,
      auctionStarted: false,
      maxTokens: "0",
      currentStage: "Loading status..."
    };
    this.getPrice = this.getPrice.bind(this)
    this.setUp = this.setUp.bind(this)
    this.startAuction = this.startAuction.bind(this)
    this.bid = this.bid.bind(this)
    this.updateStage = this.updateStage.bind(this)
    this.getMaxNumOfTokens = this.getMaxNumOfTokens.bind(this)
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.clickClaimTokenHandler = this.clickClaimTokenHandler.bind(this);
    this.claimTokens = this.claimTokens.bind(this);
    console.log("end of constructor")
  }

  componentDidMount() {
    //updates auction status every second
    this.updateStage = setInterval(this.updateStage.bind(this), 1000)
  }

  componentWillUnmount() {
    // stop updating auction status
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

  //get current bidding price per token 
  async getPrice() {
    console.log(this.state.dutchAuction)
    let current_price = await this.state.dutchAuction.methods.calcCurrentTokenPrice().call()
    console.log("current price = " + current_price)
    this.setState({ current_price })
  }

  async updateStage() { //updates the stage
    var stages = ["Auction needs setting up", "Auction not started", "Auction is ongoing", "Auction ended", "Claim your tokens", "Auction not deployed"]
    if (this.state.dutchAuction == undefined) {
      return;
    }
    let stageIndex = await this.state.dutchAuction.methods.updateStage().call()
    console.log("stageIndex: " + stageIndex + " stage: " + stages[parseInt(stageIndex)])
    if (stageIndex != undefined) {
      console.log("if statement")
      this.setState({ currentStage: stages[parseInt(stageIndex)] })
    } else {
      console.log("else statement")
      this.setState({ currentStage: "No Status" })
    }
    console.log("getStage: " + this.state.currentStage)
  }

  async setUp() {
    console.log("set up")
    //set up param is gold token address
    await this.state.dutchAuction.methods.setup(this.state.set_up_string).send({ from: this.state.currentAccount })
    console.log("just after setup")
    //await this.state.dutchAuction.methods.setup("0x9D78534Dc5d9D7Ee844dCcB90c8616F6D15B6883").send({ from: this.state.currentAccount })
  }

  //starts the dutch auction session
  async startAuction() { 
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
    var valueETHint = parseFloat(bidAmountInput);
    console.log("Amount bidded2 : " + valueETHint)
    await this.state.dutchAuction.methods.bid(this.state.currentAccount).send({ from: this.state.currentAccount, value: valueETHint * 10 ** 18 })
    console.log("bidded")
  }

  async claimTokens() { //claims tokens
    await this.state.dutchAuction.methods.claimTokens(this.state.currentAccount).send({ from: this.state.currentAccount })
    console.log("claimedTokens")
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

  endHandler() {
    this.setState({ renderSession: !this.state.renderSession })
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
    //end auction button only appears after auction has ended
    // const button_text = this.state.renderSession ? "Start Auction" : "End Auction";
    // if(renderSession)
    // var currentdate = new Date();
    // let current_time =  currentdate.getHours() + ":"  + currentdate.getMinutes()
    return (
      <div className='body_with_nav'>
        <Navbar account={this.state.currentAccount} />
        <div className='body'>
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
            // <div id="loader" class="text-center">
            //   <h1 class="text-center">Loading...</h1>
            // </div>
            :
            this.state.renderSession ?
              <div>
                {/* <SelectSession /> */}
                <FormGroup style={alignmentStyle}>
                  <div class="w-50 p-3 mb-2 bg-white border border-primary rounded">
                    <Alert variant="primary" class="text-dark font-weight-bold"><h3>Set up auction</h3></Alert>
                    <div class="form-group">
                      <label><h5>Enter Gold Token Address: </h5></label>
                      <input type="text" class="form-control" value={this.state.set_up_string} onChange={this.handleChange} placeholder="Enter GLDToken address from Ganache"></input>
                    </div>
                    <Button type="submit" onClick={this.handleSubmit} variant="primary">Submit Address</Button>
                  </div>
                </FormGroup>
                <div style={alignmentStyle}>
                  <Alert variant="info" class="text-center font-weight-bold">Auction Status: {this.state.currentStage}</Alert>
                </div>
                <div style={alignmentStyle}>
                  <Button variant="primary" style={buttonStyle} onClick={this.clickHandler}>Start Auction</Button>
                  <Button variant="primary" style={buttonStyle} onClick={this.clickClaimTokenHandler}>Claim My Tokens!</Button>
                </div>
                <div>
                  <Badge pill variant="info" style={{ marginLeft: 900 }}><i>by SLS</i></Badge>
                </div>
              </div >
              :
              <div>
                <AuctionApp
                  getPrice={this.getPrice}
                  bid={this.bid}
                  updateStage={this.updateStage}
                  getMaxNumOfTokens={this.getMaxNumOfTokens}

                  current_price={this.state.current_price}
                  currentStage={this.state.currentStage}
                  maxTokens={this.state.maxTokens}
                  tokens_remaining={this.state.tokens_remaining}
                />
                <div class="col text-center">
                  <Button variant="secondary" style={buttonStyle} onClick={() => this.endHandler()}>End Auction</Button>
                </div>

              </div>
          }

          {/* {this.state.renderSession?<SelectSession /> : null} */}
          {/* <div id="count_down"></div> */}
          {/* <SelectSession renderme={this.state.renderSession}/> */}

          {this.state.showClearancePricePopUp ? <Popup text={'At Clearance price:' + this.state.current_price + 'ETH per token'} closePopup={this.togglePopup.bind(this)} /> : null}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {this.state.showClaimTokens ?
              <Button
                onClick={this.clickClaimTokenHandler}>
                Claim My Tokens!
            </Button>
              : null}
          </div>
          {/* console.log(this.state.renderSession) */}
          {console.log(this.state.renderSession)}
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#0099ff" fill-opacity="1" d="M0,128L48,160C96,192,192,256,288,250.7C384,245,480,171,576,165.3C672,160,768,224,864,218.7C960,213,1056,139,1152,122.7C1248,107,1344,149,1392,170.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>
      </div >
    );
  }
}

export default App;
