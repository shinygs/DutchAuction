import React from 'react'

class BidButton extends React.Component{
    constructor(props){
        super(props)
        this.OnClickHandler = this.OnClickHandler.bind(this)
    }

    OnClickHandler(){
        console.log("clicked")

    }

    render(){
        return(
            <div id='bidButton'>
              <input type = 'text' placeholder ='Enter Amount' required></input>
              <button onClick={this.OnClickHandler}>Submit</button>
              
              {/* <input type = 'submit' value='Submit'></input> */}
  
          </div>
        )
    }
}

export default BidButton;