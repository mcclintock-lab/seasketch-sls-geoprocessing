// import { hot } from 'react-hot-loader'
import React from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import Clients from '../clients';
import { withStyles } from '@material-ui/core/styles';

import ClientList from './ClientList';
import ClientPage from './ClientPage';
import AppBar from './AppBar';

const App = ({ classes }) => (
  <Router>
    <div style={{flexGrow: 1}}>
      <AppBar />
      <Route path={`/client/:clientName`} component={ClientPage} />
      <Route exact path={`/`} render={(props) => <ClientList clients={Clients} {...props} />} />
    </div>
  </Router>
);

// Disable hot loading for now while using hooks
// export default hot(module)(App);
export default App;