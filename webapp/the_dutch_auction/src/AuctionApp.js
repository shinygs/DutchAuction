import React from "react";
import ReactDOM from "react-dom";
import Navbar from './Navbar'
import CanvasJSReact from './canvasjs.react';
import BidButton from './BidButton.js'
import Web3 from "web3";
import { DUTCH_AUCTION_ADDRESS, DUTCH_AUCTION_ABI } from './config';

// var React = require('react');
// var Component = React.Component;
// var CanvasJSReact = require('./canvasjs.react');
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;
// var dps = [{x: 1, y: 10}, {x: 2, y: 13}, {x: 3, y: 18}, {x: 4, y: 20}, {x: 5, y: 17},{x: 6, y: 10}, {x: 7, y: 13}, {x: 8, y: 18}, {x: 9, y: 20}, {x: 10, y: 17}]; 
// var xVal = dps.length + 1;
var dps = [{ x: 0, y: 10 }]
var xVal = 0;
var yVal = 0;
// const startingMin = 20
// let time = startingMin * 60
// setInterval(startTimer(this.state.time), 1000)

class AuctionApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      time: 20 * 60, //time is 15sec for testing (can change later) // now is 20 minutes
      tokens: 0, //for testing
      input: ""
    }
    // this.updateChart();
    this.OnClickHandler = this.OnClickHandler.bind(this)
    this.updateChart = this.updateChart.bind(this)
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.bid = this.bid.bind(this)
    this.getMaxNumOfTokens = this.getMaxNumOfTokens.bind(this)
  }

  timer() {
    this.setState({
      time: this.state.time - 1
    })
    if (this.state.time < 1) {
      clearInterval(this.intervalId);
    }
  }

  componentDidMount() {
    this.intervalId = setInterval(this.timer.bind(this), 1000);
    this.chartInterval = setInterval(this.updateChart.bind(this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearInterval(this.chartInterval);
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

  async getMaxNumOfTokens() {
    this.state.maxTokens = await this.state.dutchAuction.maxTokensSold;
    console.log("maxTokens: " + this.state.maxTokens);
  }

  async bid(valueETH) {
    await this.state.dutchAuction.methods.bid(this.state.account).send({ from: this.state.account, value: valueETH+"000000000000000000" })
    console.log("bidded")
  }

  calcExpectedTokens() {
    var amountBided = 0; // to find a way for user's input to be here
    this.state.tokens = amountBided / this.props.getPrice;
  }


  //comment out this method if dw the auto generated dynamic graph
  updateXAxis() {
    xVal++;
  }

  updateYAxis() {
      if (Number.isInteger((xVal-1)/60) && xVal-1 != 0) {
      // yVal = yVal + Math.round(5 + Math.random() * (-5 - 5));
        yVal = parseInt(this.props.current_price);
    }
  }

  updateChart() {
    this.props.getPrice();
    //add values to the dateset at runtime
    if (this.props.current_price == "") {
      return;
    }
    this.updateXAxis();
    this.updateYAxis();
    // console.log("y: " + yVal);
    dps.push({ x: xVal, y: yVal });
    // console.log(dps);
  }

    //comment this if want to show the entire graph
    // if (dps.length >  10 ) {
    // 	dps.shift();
    // }
    // this.chart.render();
  
  // componentDidMount() {
  //     console.log("mounted")
  //     // var fiveMinutes = 60 * 5,
  //     //     display = document.querySelector('#time');
  //     // const startingMin = 20
  //     // let time = startingMin * 60
  //     this.setState({time: 1200})
  //     startTimer(this.state.time);

  // };



  OnClickHandler() {
    console.log("clicked")

  }
  // componentWillUnmount(){
  //     stopTimer();
  //}

  handleChange(event) {
    this.setState({ input: event.target.value })
  }

  handleSubmit(event) {
    alert('bidding this amount of ETH: ' + this.state.input);
    this.bid(this.state.input);
    event.preventDefault();
  }


  render() {
    const minutes = Math.floor(this.state.time / 60)
    let seconds = this.state.time % 60
    seconds = seconds < 10 ? '0' + seconds : seconds;

    const options = {
      title: {
        text: "Bidding Price VS Time"
      },
      data: [{
        type: "spline",
        dataPoints: dps
      }]
    }

    return (
      <div>
        <div id="count_down"></div>
        <div id="end_msg"></div>
        <CanvasJSChart options={options} onRef={ref => this.chart = ref} />
        <h3>Current Bidding Price: {this.props.current_price}</h3>
        <h3>Tokens remaining: {this.props.maxTokens - this.state.tokens}</h3>

        {/* {this.state.time} */}
        {(() => {
          if (document.getElementById("count_down") == null) {

            console.log("this is null")

          } else {

            document.getElementById("count_down").innerHTML = `${minutes} : ${seconds}`
          }
        })()}
        {(() => {
          if (this.state.time == 0) {
            document.getElementById("end_msg").innerHTML = "Auction has ended"
          }
          {/* else{
            showButton     
            } */}
        })()}
        {this.state.time != 0 /*&& <BidButton bid={this.props.bid} />*/}
        <div id='bidButton'>
          <form onSubmit={this.handleSubmit}>
            <label>
              Enter your bidding amount in ETH:
                    <input type='text' value={this.state.input} onChange={this.handleChange} placeholder='Enter Amount' required></input>
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
        <h3>Expected to recieve: >= {this.state.tokens} Tokens</h3>
        {/* <div>
              <input type = 'text' required></input>
              <button onClick={this.OnClickHandler()}>Submit</button>
              {/* <input type = 'submit' value='Submit'></input> */}

        {/* </div> */}
        {/* {this.state.time != 0 && <BidButton />} */}
        {/* {startTimer()} */}
        {/* {setInterval(startTimer(this.state.time), 1000)} */}
      </div>

    );
  }
}

// function stopTimer(){
//     time = startingMin * 60
// }

// function startTimer(time) {
//     // console.log(time)
//     const minutes = Math.floor(time/60)
//     let seconds = time % 60
//     seconds = seconds < 10 ? '0' + seconds : seconds;
//     // countdown.innerHTML =`${minutes} : ${seconds}`;
//     // const difference = +new Date("2020-11-01") - +new Date();
//     // let remaining = "Time's up!";

//     // if (difference > 0) {
//     //   const parts = {
//     //     days: Math.floor(difference / (1000 * 60 * 60 * 24)),
//     //     hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
//     //     minutes: Math.floor((difference / 1000 / 60) % 60),
//     //     seconds: Math.floor((difference / 1000) % 60),
//     //   };
//     //   remaining = Object.keys(parts).map(part => {
//     //   return `${parts[part]} ${part}`;
//     //   }).join(" ");
//     // }
//     if(document.getElementById("count_down") == null){
//         console.log("this is null");
//     }
//     else{
//         document.getElementById("count_down").innerHTML = `${minutes} : ${seconds}`;
//     }
//     time--;
// }
export default AuctionApp;

// export default function AuctionApp(){
//     return <h1>Hello Auction</h1>
// }