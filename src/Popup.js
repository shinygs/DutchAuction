import React from "react";
import "./Popup.css";
import FormGroup from "react-bootstrap/FormGroup";
import Alert from "react-bootstrap/Alert"
import Button from 'react-bootstrap/Button';
import Badge from "react-bootstrap/Badge";
class Popup extends React.Component{
    render(){
        return(
            <div className="popup">
                <FormGroup>
                    <Alert variant="primary">
                        <h4>At Clearance price: <Badge pill variant="danger">{this.props.text} Eth</Badge> per token</h4>
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