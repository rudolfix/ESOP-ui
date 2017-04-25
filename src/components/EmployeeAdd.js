import React from 'react';

import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import RaisedButton from 'material-ui/RaisedButton';
import DatePicker from 'material-ui/DatePicker';
import FontIcon from 'material-ui/FontIcon';

export default class EmployeeAdd extends React.Component {

    constructor(props) {
        super(props);
        this.services = props.services;
        this.store = props.store;

        this.miniSignPeriod = Math.floor(this.store.getState().ESOP.minimumManualSignPeriod / this.day) + 1;

        this.state = {
            allowValidation: false,
            employeePublicKey: "",
            employeePublicKeyValidation: "",
            issueDate: new Date(),
            extraOptions: false,
            timeToSign: this.miniSignPeriod.toString(),
            timeToSignValidation: "",
            extraOptionsNumber: "",
            extraOptionsNumberValidation: ""
        }
    }

    day = 24 * 60 * 60;

    validatePublicKey = (value) => {
        let validationOutcome = value === '' ? "please fill this field" : "";
        this.setState({employeePublicKeyValidation: validationOutcome});
        return validationOutcome;
    };

    validateTimeToSign = (value) => {
        let validationOutcome = value === '' ? "please fill this field" : "";

        if (validationOutcome == "") {
            let num = parseInt(value);
            if (isNaN(num))
                validationOutcome = 'value us not a number';
            else if (num < this.miniSignPeriod)
                validationOutcome = `value must be bigger than ${this.miniSignPeriod - 1}`;
        }
        this.setState({timeToSignValidation: validationOutcome});
        return validationOutcome;
    };

    validateExtraOptions = (value) => {

        if (!this.state.extraOptions) // we do not validate if extra options checkbox is not checked
            return "";

        let validationOutcome = value === '' ? "please fill this field" : "";

        if (validationOutcome == "") {
            let num = parseInt(value);
            if (isNaN(num))
                validationOutcome = 'value us not a number';
            else if (num <= 0)
                validationOutcome = 'value must be bigger than zero';
        }
        this.setState({extraOptionsNumberValidation: validationOutcome});
        return validationOutcome;
    };

    handleTextFieldChange = (fieldName, validateFunction) =>
        (event, newValue) => {
            let obj = {};
            obj[fieldName] = newValue;
            this.setState(obj);
            if (this.state.allowValidation) {
                validateFunction(newValue);
            }
        };

    validateFields = () => {
        let validateEmployeePublicKey = this.validatePublicKey(this.state.employeePublicKey) == "";
        let validateTimeToSign = this.validateTimeToSign(this.state.timeToSign) == "";
        let validateExtraOptionsNumber = this.validateExtraOptions(this.state.extraOptionsNumber) == "";

        return validateEmployeePublicKey && validateTimeToSign && validateExtraOptionsNumber
    };

    handleExtraOptionsCheckbox = (event, isInputChecked) => {
        this.setState({extraOptions: isInputChecked});
    };

    handleAddUserButton = () => {

        this.setState({allowValidation: true});
        if (!this.validateFields()) {
            return;
        }

        let employeePublicKey = this.state.employeePublicKey;
        let issueDate = Math.floor(this.state.issueDate / 1000);
        let timeToSign = Math.floor(new Date() / 1000) + this.day * parseInt(this.state.timeToSign);
        let grantExtraOptions = this.state.extraOptions;
        let extraOptionsNumber = parseInt(this.state.extraOptionsNumber);

        if (!grantExtraOptions) {
            extraOptionsNumber = 0;
        }

        this.store.dispatch({
            type: "SHOW_CONFIRM_TRANSACTION_DIALOG",
            confirmTransactionDialog: true
        });

        this.services.ESOPService.addEmployee(employeePublicKey, issueDate, timeToSign, extraOptionsNumber).then(
            success => {
                this.services.ESOPService.getESOPDataFromContract();
                this.setState({
                    employeePublicKey: '',
                    issueDate: new Date(),
                    extraOptions: false,
                    timeToSign: "15",
                    extraOptionsNumber: ''
                });
                this.store.dispatch({
                    type: "SHOW_CONFIRM_TRANSACTION_DIALOG",
                    confirmTransactionDialog: false
                });
            },
            error => {

                this.store.dispatch({
                    type: "SHOW_CONFIRM_TRANSACTION_DIALOG",
                    confirmTransactionDialog: false
                });

                this.store.dispatch({
                    type: "SHOW_ERROR_DIALOG",
                    errorDialog: true
                });
                console.log(error);
            }
        );
    };

    render() {
        let numberFormatter = new Intl.NumberFormat();

        let textFieldsProps = {};

        textFieldsProps.employeePublicKey = {
            floatingLabelText: "public key",
            className: "employee_parameter",
            value: this.state.employeePublicKey,
            onChange: this.handleTextFieldChange("employeePublicKey", this.validatePublicKey),
            style: {width: "32.000rem"}
        };

        textFieldsProps.timeToSign = {
            floatingLabelText: "time to sign [days]",
            className: "employee_parameter",
            value: this.state.timeToSign,
            onChange: this.handleTextFieldChange("timeToSign", this.validateTimeToSign)
        };

        textFieldsProps.extraOptionsNumber = {
            floatingLabelText: "extra options number",
            className: "employee_parameter",
            value: this.state.extraOptionsNumber,
            onChange: this.handleTextFieldChange("extraOptionsNumber", this.validateExtraOptions),
            disabled: !this.state.extraOptions
        };

        textFieldsProps.poolOptionsNumber = {
            floatingLabelText: "pool options for new employee",
            className: "employee_parameter",
            disabled: true,
            value: numberFormatter.format(this.store.getState().ESOP.newEmployeePoolOption)
        };

        if (this.state.allowValidation) {
            textFieldsProps.employeePublicKey.errorText = this.state.employeePublicKeyValidation;
            textFieldsProps.timeToSign.errorText = this.state.timeToSignValidation;
            textFieldsProps.extraOptionsNumber.errorText = this.state.extraOptionsNumberValidation;
        }

        return (
            <div className="row">
                <div className="col-xs-12 employee_add">
                    <h3>Add employee:</h3>

                    <TextField {...textFieldsProps.employeePublicKey}/>

                    {this.state.employeePublicKey != '' &&
                    <a target="_blank" href={`https://etherscan.io/address/${this.state.employeePublicKey}`}>
                        <FontIcon className="material-icons">link</FontIcon>
                    </a>
                    }

                    <DatePicker hintText="issue date" mode="landscape"
                                value={this.state.issueDate}
                                onChange={(event, newValue) => this.setState({issueDate: newValue})}/>

                    <TextField {...textFieldsProps.timeToSign}/>

                    <Checkbox label="issue extra options instead of pool options" checked={this.state.extraOptions}
                              onCheck={this.handleExtraOptionsCheckbox}/>

                    {this.state.extraOptions ?
                        <TextField {...textFieldsProps.extraOptionsNumber}/>
                        :
                        <TextField {...textFieldsProps.poolOptionsNumber}/>
                    }

                    <br />
                    <RaisedButton label="Add employee" onClick={this.handleAddUserButton}/>
                </div>
            </div>
        )
    }
}