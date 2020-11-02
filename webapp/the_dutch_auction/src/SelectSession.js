import React from "react";
import ListGroup from 'react-bootstrap/ListGroup';



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
        let hours = currentdate.getHours();
        hours = hours < 10 ? '0' + hours : hours;
        let minutes = currentdate.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;
        let current_time = hours + ":" + minutes;

        let futureHours = (currentdate.getHours() + 1) < 10 ? '0' + (currentdate.getHours() + 1) : (currentdate.getHours() + 1);
        let futureMinutes = (currentdate.getMinutes()) < 10 ? '0' + (currentdate.getMinutes()) : (currentdate.getMinutes());
        let future_time = futureHours + ":" + futureMinutes
        return (
            <div>
                <h2 className='page_title'>Select a Session</h2>
                <ListGroup className='cardGrp'>
                    <ListGroup.Item action href="#link1" className = "card list-group-item-text text-center" >
                        This session will start at {current_time}
                    </ListGroup.Item>
                    <ListGroup.Item action href="#link2" className = "card list-group-item-text text-center">
                        This session will start at {future_time}
                    </ListGroup.Item>
                </ListGroup>
                <br></br>
                {/* <div className='container'>
                    <div className='card'>
                        <div className="detail_container">
                            <h3 >This session will start at {current_time}</h3> */}
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
                        {/* </div>
                    </div>
                </div> */}
            </div>
        );
    }
}

export default SelectSession;