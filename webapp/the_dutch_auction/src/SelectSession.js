import React from "react";
import { BrowserRouter, Route, Switch, NavLink, Link} from 'react-router-dom';


// import { Button } from 'react-bootstrap';

//dutch auction session time
class SelectSession extends React.Component{
    constructor(props)
    {
        super(props)
        // this.state = {
        //     renderme: false
        // }
        // this.clickHandler=this.clickHandler.bind(this)
    }

    // clickHandler(){
    //     this.setState({renderme: false});
    // }
    render(){
        //display current time for the session start time
        var currentdate = new Date();
        let minutes = currentdate.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;
        let current_time =  currentdate.getHours() + ":"  + minutes
        return(
            <div>
              <h2 id='page_title'>Select a Session</h2>
                  <div className='container'>
                       <div className='card'>
                              <div className="detail_container">
                                  <h3 >This session will start at {current_time}</h3>
                                  {/* {console.log(this.state.renderme)} */}
                                  {/* <Button onClick={this.clickHandler}>Start Auction</Button> */}
                                {/* <Link to='/AuctionApp' >Start auction</Link> */}
              {/* <Link to='/AuctionApp'><button onClick={onClick}>Start Auction</button></Link> */}
              
                        {/* <BrowserRouter>
                        <div>
                            <NavLink to="/AuctionApp">Start Auction</NavLink>
                            

                            <Switch>
                            <Route path="/AuctionApp" component={AuctionApp}/>
                            </Switch>
                        </div> 
                        </BrowserRouter> */}
                        </div>
                    </div>
                    </div>
            </div>
        );
    }
}

export default SelectSession;