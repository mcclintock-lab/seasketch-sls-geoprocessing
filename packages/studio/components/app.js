import React from 'react';
import { hot } from 'react-hot-loader'
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Clients from '../clients';
import { withStyles } from '@material-ui/core/styles';

import ClientList from './ClientList';
import ClientPage from './ClientPage';
import AppBar from './AppBar';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  }
});

const App = ({ classes }) => (
  <Router>
    <div className={classes.root}>
      <AppBar />
      <Route path={`/client/:clientName`} component={ClientPage} />
      <Route exact path={`/`} render={(props) => <ClientList clients={Clients} {...props} />} />
    </div>
  </Router>
);

export default hot(module)(withStyles(styles)(App));