import React from 'react';
import { withRouter } from "react-router";
import MaterialAppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import BackIcon from '@material-ui/icons/ArrowBack';
import { withStyles } from '@material-ui/core';

const styles = (theme) => ({
  flex: {
    flex: 1,
  },
  backButton: {
    marginLeft: -12,
    marginRight: 20,
  }
});


const AppBar = ({history, classes}) => (
  <MaterialAppBar position="static">
    <Toolbar>
      {
        history.location.pathname !== "/" && (
          <IconButton className={classes.backButton} color="inherit" aria-label="Back">
            <BackIcon onClick={() => history.goBack()} />
          </IconButton>
        )
      }
      <Typography variant="title" color="inherit" className={classes.flex}>
        {
          history.location.pathname === "/" ? "SeaSketch Report Client Studio" : history.location.pathname.split("/").pop()
        }
      </Typography>
    </Toolbar>
  </MaterialAppBar>
);

export default withRouter(withStyles(styles)(AppBar));
