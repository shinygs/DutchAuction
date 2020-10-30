import React from "react";
import ReactDOM from "react-dom";
import "./App.css";
import Web3 from "web3";
import Navbar from './Navbar'
import Popup from './Popup'
import SelectSession from "./SelectSession"
// import { Link } from 'react-router';
import AuctionApp from "./AuctionApp";
import {DUTCH_AUCTION_ADDRESS,DUTCH_AUCTION_ABI} from './config'

import { BrowserRouter, Route, Switch, NavLink, Link} from 'react-router-dom';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      account: '0x0',
      queryInput: "",
      deposit: 0,
      renderSession: true,
      showPopup: false,
      current_price: "20",
      tokens_remaining: "0",
      loading: true
    };
    this.getPrice = this.getPrice.bind(this)
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }


  async loadBlockchainData() {
    const web3 = window.web3

    const accounts = await web3.eth.getAccounts()
    console.log(accounts)
    this.setState({ account: accounts[0] })
    const dutchAuction = new web3.eth.Contract(DUTCH_AUCTION_ABI, DUTCH_AUCTION_ADDRESS)
    this.setState({ dutchAuction })
    const networkId = await web3.eth.net.getId()
    console.log(networkId)
    this.setState({ loading: false })
    this.getPrice()
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
    const current_price = await this.state.dutchAuction.methods.calcTokenPrice().call()
    current_price = await this.state.dutchAuction.methods.toViewablePrice(current_price).call()
    this.setState({current_price})
  }

  togglePopup() {  
    this.setState({  
         showPopup: !this.state.showPopup  
    });  
     } 

  clickHandler(){
    this.setState({renderSession: !this.state.renderSession})
    
    console.log("hello")
    if(!this.state.renderSession)
    {
      
      // this.setState({showPopup: !this.state.showPopup})
      this.togglePopup()
    }
    // else{
    //   ReactDOM.unmountComponentAtNode(document.getElementById('count_down'))
    // }
  }


  
  render() {
    const button_text = this.state.renderSession? "Start Auction" : "End Auction";
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
              

              {this.state.loading ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div> :this.state.renderSession?<SelectSession /> : <AuctionApp getPrice={this.getPrice} current_price = {this.state.current_price} remaining = {this.state.tokens_remaining}/>}
              {/* {this.state.renderSession?<SelectSession /> : null} */}
              {/* <div id="count_down"></div> */}
              {/* <SelectSession renderme={this.state.renderSession}/> */}
              <button onClick={this.clickHandler.bind(this)}>{button_text}</button>
              {/* <button onClick={() =>{this.setState({renderSession: !this.state.renderSession})}}>{button_text}</button> */}
              {this.state.showPopup?<Popup text={'At Clearance price:'+ this.state.current_price + 'ETH per token'}  closePopup={this.togglePopup.bind(this)} />: null}
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
