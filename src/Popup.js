import React from "react";
import "./Popup.css";
import FormGroup from "react-bootstrap/FormGroup";
import Alert from "react-bootstrap/Alert"
import Button from 'react-bootstrap/Button';
import Badge from "react-bootstrap/Badge";
class Popup extends React.Component {
    render() {
        return (
            <div className="popup">
                <FormGroup>
                    <Alert variant="primary">
                        <h4> Auction ended at clearance price of <Badge pill variant="danger">{this.props.text} ETH</Badge> per token. <br/>You can claim <Badge pill variant="success">{this.props.tokens} GLD</Badge> Tokens!</h4>
                        <div class="col text-right">
                            <Button variant="primary" onClick={this.props.closePopup}>Close me</Button>
                        </div>

                    </Alert>
                </FormGroup>
            </div>
        )
    }
}

export default Popup