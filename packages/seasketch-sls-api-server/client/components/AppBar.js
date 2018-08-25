import React from "react";
import { withRouter, Link } from "react-router-dom";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import BackIcon from '@material-ui/icons/ArrowBack';
import { withStyles } from '@material-ui/core/styles';


const styles = {
  flex: {
    flex: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    colorPrimary: 'white',
    colorSecondary: 'white',
    colorInherit: 'white'
  }
};

const backLink = (path) => {
  if (path.length < 2 || /invocations/.test(path)) {
    return "/";
  } else {
    let parts = path.split('/');
    return parts.slice(0, parts.length - 1).join('/')
  }
}

const getTitle = (path) => {
  if (path.length < 2) {
    return "SeaSketch Geoprocessing Projects";
  } else if (/invocations/.test(path)) {
    return "Invocation Details";
  } else {
    return path.split('/').slice(1).join(" / ");
  }
}

const ABar = ({history, match, classes}) => (
  <AppBar position="static">
    <Toolbar>
      {history.location.pathname.length > 2 && (
        <React.Fragment>
          <Link to={backLink(history.location.pathname)}>
            <IconButton className={classes.menuButton} style={{ color: 'white' }} aria-label="Back">
              <BackIcon />
            </IconButton>
          </Link>
        </React.Fragment>
      )}
      <Typography variant="headline" color="inherit" className={classes.flex}>
        {
          getTitle(history.location.pathname)
        }
      </Typography>
      {/* <Button color="inherit">Login</Button> */}
    </Toolbar>
  </AppBar>
)

export default withRouter(withStyles(styles)(ABar));