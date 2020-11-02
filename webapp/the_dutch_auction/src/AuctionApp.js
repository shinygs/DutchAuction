import React from "react";
import ReactDOM from "react-dom";
import Navbar from './Navbar'
import CanvasJSReact from './canvasjs.react';
import BidButton from './BidButton.js'
import Web3 from "web3";
import { DUTCH_AUCTION_ADDRESS, DUTCH_AUCTION_ABI } from './config';
import Button from "react-bootstrap/esm/Button";

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
      bidAmountInput: "",
      remainingTokens: "0",
      userTokens: "0"
    }
    // this.updateChart();
    this.updateChart = this.updateChart.bind(this)
    this.handleBidInputChange = this.handleBidInputChange.bind(this);
    this.handleBidInputSubmit = this.handleBidInputSubmit.bind(this);
    this.calcRemainTokens = this.calcRemainTokens.bind(this);
    this.calcExpectedTokens = this.calcExpectedTokens.bind(this);
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
    this.remainTokenInterval = setInterval(this.calcRemainTokens.bind(this), 1000);
    this.userExpectedTokenInterval = setInterval(this.calcExpectedTokens.bind(this), 1000)
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearInterval(this.chartInterval);
    clearInterval(this.remainTokenInterval);
  }

  //comment out this method if dw the auto generated dynamic graph
  updateXAxis() {
    xVal++;
  }

  updateYAxis() {
    if (Number.isInteger((xVal - 1) / 60) && xVal - 1 != 0) {
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

  calcExpectedTokens() { //not sure how to call
    var temp = parseInt(this.state.bidAmountInput) / parseInt(this.props.current_price);
    console.log("Expected tokens: " + temp);
    if (parseInt(temp)) {
      this.setState({ userTokens: temp })
    }
  }

  calcRemainTokens() {
    var temp = parseInt(this.props.maxTokens) - parseInt(this.state.userTokens);
    console.log("Remaining tokens: " + temp);
    if (parseInt(temp)) {
      this.setState({ remainingTokens: temp })
    }
  }

  handleBidInputChange(event) {
    this.setState({ bidAmountInput: event.target.value })
  }

  handleBidInputSubmit(event) {
    var bool = window.confirm("Bid " + this.state.bidAmountInput + " ETH ?");
    if (bool) {
      this.props.bid(this.state.bidAmountInput);
    }
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
      <div >
        <div id="count_down"></div>
        <div id="end_msg"></div>
        <p>{this.props.currentStage}</p>
        <button onClick={this.props.onClickUpdateStage}>Check Auction Status</button>
        <h2>Tokens On Sale: {this.state.remainingTokens}</h2>
        <div className='chartContainer'>
        <CanvasJSChart options={options} onRef={ref => this.chart = ref} />
        </div>
        <div className="bidding_info">
        <h3>Current Bidding Price: {this.props.current_price}</h3>
        <br></br>
        <h3>Tokens remaining: {this.state.remainingTokens}</h3>
        <br></br>
        <div>
        <button onClick={this.calcRemainTokens}>Calculate Remaining Tokens On Sale</button>
        </div>
        <br></br>

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
          <form onSubmit={this.handleBidInputSubmit}>
            <label>
              Enter your bidding amount in ETH:
              <input type='number'
                value={this.state.bidAmountInput}
                onChange={this.handleBidInputChange}
                placeholder='Enter Amount'
                min="0"
                required>
              </input>
            </label>
            <input type="submit" value="Submit" />
          </form>
        </div>
        <br></br>
        <h3>Expected to recieve: >= {this.props.currentUserTokens} Tokens</h3>
        <button onClick={this.calcExpectedTokens}>Calculate User Expected Tokens</button>
        </div>
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