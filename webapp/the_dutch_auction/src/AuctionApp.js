import React from "react";
import ReactDOM from "react-dom";
import Navbar from './Navbar'
import CanvasJSReact from './canvasjs.react';


// var React = require('react');
// var Component = React.Component;
// var CanvasJSReact = require('./canvasjs.react');
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;
const startingMin = 20
let time = startingMin * 60
setInterval(startTimer, 1000)

class AuctionApp extends React.Component{
    constructor(props){
        super(props)

    }


    
    componentDidMount() {
        // var fiveMinutes = 60 * 5,
        //     display = document.querySelector('#time');
        startTimer();
        
    };
    

    // componentWillUnmount(){
    //     alert("Auction has ended");
    //     alert(this.props.current_price)
    // }


    render(){
        
        const options = {
            title: {
              text: "Price VS Supplies"
            },
            data: [{				
                      type: "line",
                      dataPoints: [
                          { label: "Apple",  y: 10  },
                          { label: "Orange", y: 15  },
                          { label: "Banana", y: 25  },
                          { label: "Mango",  y: 30  },
                          { label: "Grape",  y: 28  }
                      ]
             }]
         }
        
        return(
            <div>
                <div id="count_down"></div>
                
                <CanvasJSChart options = {options}/>
                <h3>Current Bidding Price: {this.props.current_price}</h3>
                {/* {startTimer()} */}
            </div>
          
        );
    }
}


function startTimer() {

    const minutes = Math.floor(time/60)
    let seconds = time % 60
    seconds = seconds < 10 ? '0' + seconds : seconds;
    // countdown.innerHTML =`${minutes} : ${seconds}`;
    // const difference = +new Date("2020-11-01") - +new Date();
    // let remaining = "Time's up!";
  
    // if (difference > 0) {
    //   const parts = {
    //     days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    //     hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    //     minutes: Math.floor((difference / 1000 / 60) % 60),
    //     seconds: Math.floor((difference / 1000) % 60),
    //   };
    //   remaining = Object.keys(parts).map(part => {
    //   return `${parts[part]} ${part}`;
    //   }).join(" ");
    // }
    if(document.getElementById("count_down") == null){
        console.log("this is null");
    }
    else{
        document.getElementById("count_down").innerHTML = `${minutes} : ${seconds}`;
    }
    time--;
}
export default AuctionApp;

// export default function AuctionApp(){
//     return <h1>Hello Auction</h1>
// }