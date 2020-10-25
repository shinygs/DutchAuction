import React from "react";
import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      queryInput: "",
      depositInput: 0,
      address: "0x0",
      deposit: 0,
    };
  }

  render() {
    return (
      <div>
        <h1>I'm a Dutch Auction App:))</h1>
      </div>
    );
  }
}

export default App;
