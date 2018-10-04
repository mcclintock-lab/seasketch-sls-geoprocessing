import React from "react";
import { withRouter, Link } from "react-router-dom";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import BackIcon from "@material-ui/icons/ArrowBack";
import { withStyles } from "@material-ui/core/styles";
import MenuIcon from "@material-ui/icons/Menu";
import AccountCircle from "@material-ui/icons/AccountCircle";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import LoginPrompt from './LoginPrompt';
import md5 from 'md5';

const styles = {

};

class AuthButton extends React.Component {

  state = {
    auth: true,
    anchorEl: null,
    showDialog: false
  };

  handleChange = event => {
    this.setState({ auth: event.target.checked });
  };

  handleMenu = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleLogout = () => {
    delete localStorage.token;
    delete localStorage.email;
    window.location.reload();
  }

  render() {
    const {
      classes
    } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    
    if (localStorage.token && localStorage.token.length) {
      return <div>
          <IconButton
            aria-owns={open ? "menu-appbar" : null}
            aria-haspopup="true"
            onClick={this.handleMenu}
            color="inherit"
          >
            <img style={{borderRadius: 20, width: 42}} src={`https://www.gravatar.com/avatar/${md5(localStorage.email)}`} />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right"
            }}
            open={open}
            onClose={this.handleClose}
          >
            <MenuItem onClick={this.handleLogout}>Logout</MenuItem>
          </Menu>
        </div>
    } else {
      return (
        <div>
          <Button color="inherit" onClick={() => this.setState({showDialog: true})}>Login</Button>
          { this.state.showDialog && <LoginPrompt onClose={() => this.setState({showDialog: false})} /> }
        </div>
      )
    }
  }
}

export default withStyles(styles)(AuthButton);
