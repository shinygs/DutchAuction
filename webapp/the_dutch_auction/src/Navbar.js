import React, { Component } from 'react'
import bid_icon from './bid.png'

//start page header
class Navbar extends Component {

  render() {
    return (
      // <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
      <nav className = 'App-header'>
        <img src={bid_icon} width="50" height="50" className="d-inline-block align-top" alt="" />
        &nbsp; Thy Dutch Auction


        <ul className="navbar-nav px-3">
            <small id="account">Account: {this.props.account}</small>
        </ul>
      </nav>
    );
  }
}

export default Navbar;
