import React from 'react'

class BidButton extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            input: ""
        };
        this.OnClickHandler = this.OnClickHandler.bind(this)
    }

    OnClickHandler() {
        console.log("clicked value = " + this.state.input);
        this.props.bid(this.state.input);
    }

    handleChange(event) {
        this.setState({ input: event.target.value })
    }
    handleSubmit(event) {
        alert('bidding this amount of ETH: ' + this.state.input);
        this.bid(this.state.input);
        event.preventDefault();
    }

    render() {
        return (
            <div id='bidButton'>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Enter your bidding amount in ETH:
                    <input type='text' value={this.state.input} onChange={this.handleChange} placeholder='Enter Amount' required></input>
                    </label>
                    <input type="submit" value="Submit" />
                </form>
                {/* <button onClick={this.OnClickHandler}>Submit</button> */}
                {/* <input type = 'submit' value='Submit'></input> */}

            </div>
        )
    }
}

export default BidButton;