import React from "react";
import ReactDOM from "react-dom";
import "./App.css";
import Web3 from "web3";
import Navbar from './Navbar'
import Popup from './Popup'
import SelectSession from "./SelectSession"
import Button from 'react-bootstrap/Button';
// import { Link } from 'react-router';
import AuctionApp from "./AuctionApp";
import { DUTCH_AUCTION_ADDRESS, DUTCH_AUCTION_ABI } from './config'

import { BrowserRouter, Route, Switch, NavLink, Link } from 'react-router-dom';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: '0x0',
      queryInput: "",
      deposit: 0,
      renderSession: true,
      showPopup: false,
      current_price: "",
      tokens_remaining: "0",
      loading: true,
      set_up_string: '',
      showClaimTokens: false,
      auctionStarted: false
    };
    this.getPrice = this.getPrice.bind(this)
    this.setUp = this.setUp.bind(this)
    this.startAuction = this.startAuction.bind(this)
    this.bid = this.bid.bind(this)
    this.getMaxNumOfTokens = this.getMaxNumOfTokens.bind(this)
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
    this.setState({ account: accounts[0] })
    const dutchAuction = new web3.eth.Contract(DUTCH_AUCTION_ABI, DUTCH_AUCTION_ADDRESS)
    this.setState({ dutchAuction })
    console.log("dutchau smart contract")
    console.log(dutchAuction)
    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    this.setState({ loading: false })
    //this.setUp()
    //this.startAuction()
    //this.getPrice()
    //this.getMaxNumOfTokens()
    console.log("End of Load Data")
  }
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }
  async getPrice() {
    console.log(this.state.dutchAuction)
    let current_price = await this.state.dutchAuction.methods.calcCurrentTokenPrice().call()
    console.log("current price = " + current_price)
    //let stage = await this.state.dutchAuction.stage
    //console.log("stage: " + stage)
    //current_price = await this.state.dutchAuction.methods.toViewablePrice(current_price).call()
    //current_price = this.state.web3.fromWei( current_price.toNumber(), 'ether' )
    this.setState({ current_price })
  }

  async setUp() {
    console.log("set up")
    //set up param is gold token address
    await this.state.dutchAuction.methods.setup(this.state.set_up_string).send({ from: this.state.account })
    console.log("just after setup")
    //await this.state.dutchAuction.methods.setup("0x9D78534Dc5d9D7Ee844dCcB90c8616F6D15B6883").send({ from: this.state.account })
  }

  async startAuction() {
    await this.state.dutchAuction.methods.startAuction().send({ from: this.state.account })
    console.log("started auction")
    this.state.auctionStarted = true
  }

  async getMaxNumOfTokens(){
    let maxTokens = await this.state.dutchAuction.maxTokensSold;
    console.log("maxTokens: " + maxTokens);
  }

  async bid() {
    await this.state.dutchAuction.methods.bid().send({ from: this.state.account })
    console.log("bidded")
  }

  togglePopup() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }

  clickHandler() {
    this.setState({ renderSession: !this.state.renderSession })


    console.log("hello")
    if (!this.state.renderSession) {

      // this.setState({showPopup: !this.state.showPopup})
      this.togglePopup()
      this.setState({
        showClaimTokens: !this.state.showClaimTokens
      });
    }
    else {
      this.startAuction()
    }

    //this.startAuction()
    // else{
    //   ReactDOM.unmountComponentAtNode(document.getElementById('count_down'))
    // }
  }
  handleChange(event) {
    this.setState({ set_up_string: event.target.value });
  }
  handleSubmit(event) {
    alert('setting up token with address: ' + this.state.set_up_string);
    this.setUp();
    event.preventDefault();
  }

  render() {
    const button_text = this.state.renderSession ? "Start Auction" : "End Auction";
    // if(renderSession)
    // var currentdate = new Date();
    // let current_time =  currentdate.getHours() + ":"  + currentdate.getMinutes()
    return (
      <div>
        <Navbar account={this.state.account} />
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
          : this.state.renderSession ? <div>
            <SelectSession />
            <form onSubmit={this.handleSubmit}>
              <label>
                Set up auction, put GLDToken address:
                      <input type="text" value={this.state.set_up_string} onChange={this.handleChange} />
              </label>
              <input type="submit" value="Submit" />
            </form>
          </div>
            :
            <AuctionApp
              getPrice={this.getPrice}
              bid={this.bid}
              maxTokens={this.maxTokens}
              auctionStarted={this.auctionStarted}
              current_price={this.state.current_price}
              remaining={this.state.tokens_remaining} />}
        {/* {this.state.renderSession?<SelectSession /> : null} */}
        {/* <div id="count_down"></div> */}
        {/* <SelectSession renderme={this.state.renderSession}/> */}


        <button onClick={
          this.clickHandler.bind(this)
          //if(auctionStarted){
            //go to AuctionApp
          //}
        }>
          {button_text}
        </button>
        {/* <button onClick={() =>{this.setState({renderSession: !this.state.renderSession})}}>{button_text}</button> */}
        {this.state.showPopup ? <Popup text={'At Clearance price:' + this.state.current_price + 'ETH per token'} closePopup={this.togglePopup.bind(this)} /> : null}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {this.state.showClaimTokens ? <Button>Claim My Tokens!</Button> : null}
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


      </div>
    );
  }
}

export default App;
