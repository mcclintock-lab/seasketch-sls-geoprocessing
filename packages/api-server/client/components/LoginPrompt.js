import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class FormDialog extends React.Component {
  state = {
    open: true,
    submitting: false,
    errors: null
  };

  async handleSubmit() {
    this.setState({
      submitting: true
    })
    const response = await fetch("/api/getToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({email: this.state.email, password: this.state.password})
    });
    if (response.ok) {
      const body = await response.text()
      localStorage.token = body;
      localStorage.email = this.state.email;
      window.location.reload();
    } else {
      this.setState({errors: "Invalid username or password", submitting: false});
    }
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value,
    });
  };

  render() {
    return (
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Sign In</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You must be a SeaSketch system administrator to sign into this page.
            </DialogContentText>
            <TextField
              onChange={this.handleChange('email')}
              autoFocus
              margin="dense"
              id="name"
              label="Email Address"
              type="email"
              value={this.state.email}
              fullWidth
            />
            <br />
            <TextField
              onChange={this.handleChange('password')}
              margin="dense"
              id="pw"
              label="Password"
              type="password"
              value={this.state.password}
              fullWidth
            />
          { this.state.errors && <DialogContentText>{this.state.errors}</DialogContentText> }          
          </DialogContent>
          <DialogActions>
            <Button onClick={this.props.onClose} color="primary">
              Cancel
            </Button>
            <Button disabled={!!this.state.submitting} onClick={this.handleSubmit.bind(this)} color="primary">
              Sign In
            </Button>
          </DialogActions>
        </Dialog>
    );
  }
}