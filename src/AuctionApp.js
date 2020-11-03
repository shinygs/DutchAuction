import React from "react";
import CanvasJSReact from './canvasjs.react';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import FormGroup from "react-bootstrap/FormGroup";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";

var CanvasJSChart = CanvasJSReact.CanvasJSChart;
var dps = [{ x: 0, y: 10 }]
var xVal = 0;
var yVal = 0;

//auction page
class AuctionApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      time: 20 * 60, //20 minutes (duration of a single auction session)
      bidAmountInput: "",
      previousBiddedAmount: "0",
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

  //keep track of time left for the dutch auction session
  timer() {
    this.setState({
      time: this.state.time - 1
    })
    if (this.state.time < 1) {
      clearInterval(this.intervalId); //
    }
  }

  //refresh timer and graph every 1 second
  componentDidMount() {
    this.intervalId = setInterval(this.timer.bind(this), 1000);
    this.chartInterval = setInterval(this.updateChart.bind(this), 1000);
    this.userExpectedTokenInterval = setInterval(this.calcExpectedTokens.bind(this), 1000);
    this.calcRemainTokensInterval = setInterval(this.calcRemainTokens.bind(this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearInterval(this.chartInterval);
    clearInterval(this.userExpectedTokenInterval);
    clearInterval(this.calcRemainTokensInterval);
  }

  //comment out this method if dw the auto generated dynamic graph
  updateXAxis() {
    xVal++;
  }

  //update the current bidding price per token every minute
  updateYAxis() {
    yVal = parseInt(this.props.current_price);
  }

  //update graph with the current time and current bidding price
  updateChart() {
    this.props.getPrice();
    if (this.props.current_price == "") {
      return;
    }
    this.updateXAxis();
    this.updateYAxis();
    dps.push({ x: xVal, y: yVal }); //add values to the dateset at runtime
  }

  calcExpectedTokens() { //not sure how to call
    console.log("Price now: " + this.props.current_price);
    console.log("Bid Amount: " + this.state.previousBiddedAmount);
    var temp = parseFloat(this.state.previousBiddedAmount) / parseInt(this.props.current_price);
    console.log("Expected tokens: " + temp);
    if (parseFloat(temp) <= 10) {
      this.setState({ userTokens: temp })
    }
    else {
      this.setState({ userTokens: 10 })
    }
  }

  calcRemainTokens() {
    this.props.getMaxNumOfTokens();
    console.log("Max Tokens: " + this.props.maxTokens);
    var temp = parseFloat(this.props.maxTokens) - parseFloat(this.state.userTokens);
    console.log("Remaining tokens: " + temp);
    if (parseFloat(temp)) {
      this.setState({ remainingTokens: temp })
    }
  }

  handleBidInputChange(event) {
    this.setState({ bidAmountInput: event.target.value })
  }

  handleBidInputSubmit(event) {
    var bool = window.confirm("Bid " + this.state.bidAmountInput + " ETH ?");
    this.setState({ previousBiddedAmount: this.state.bidAmountInput })
    if (bool) {
      this.props.bid(this.state.previousBiddedAmount);
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

    const alignmentStyle = {
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    };

    const bidStyle = {
      padding: "10px",
      width: "50%",
      marginTop: "250px"
    }

    return (
      <div>
        <div style={alignmentStyle}>
          <Alert variant="info">Auction Status : {this.props.currentStage}</Alert>
        </div>
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
        })()}
        <div style={alignmentStyle}>
          <h1 id="end_msg"></h1>
          <h1 id="count_down"> 20 : 00</h1>
        </div>
        <div>
          <div className="token_info">
            <FormGroup>
              <div class="mb-2 bg-white border border-dark rounded">
                <Alert variant="primary" class="font-weight-bold">This Auction's supply of Gold Tokens:{' '}
                  <Badge pill variant="danger">{this.state.remainingTokens} GLD</Badge>
                </Alert>
                <Alert variant="white">Current Price Per Token:{' '}
                  <Badge pill variant="dark">{this.props.current_price} ETH</Badge>
                </Alert>
                <Alert variant="white">Number of Gold Tokens Left:{' '}
                  <Badge pill variant="dark">{this.state.remainingTokens} GLD</Badge>
                </Alert>
              </div>
            </FormGroup>
          </div>
          <div className='chartContainer'>
            <CanvasJSChart options={options} onRef={ref => this.chart = ref} />
          </div>
        </div>
        <div style={bidStyle}>
          <FormGroup>
            <div class="p-3 mb-2 bg-white border border-dark rounded">
              <div class="form-group">
                <Form.Label>Enter amount to Bid in ETH:</Form.Label>
                <Form.Control type='number' value={this.state.bidAmountInput} onChange={this.handleBidInputChange} placeholder='Enter Amount In ETH' min='0' required></Form.Control>
                <Form.Text className="text-muted">Change will be provided.</Form.Text>
              </div>
              <Button type="submit" onClick={this.handleBidInputSubmit} variant="primary">Bid!</Button>
            </div>
            <Alert variant="primary">Previous bid of <u>{this.state.previousBiddedAmount} ETH</u><br />will receive{" "}
              <Badge pill variant="success">{this.state.userTokens} GLD</Badge>
            </Alert>
          </FormGroup>
        </div>
      </div>
    );
  }
}
export default AuctionApp;