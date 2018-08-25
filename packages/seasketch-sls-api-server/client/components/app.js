import React from "react";
import { Route } from "react-router-dom";
import FunctionPage from "./FunctionPage";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import Functions from './Functions';
import { matchPath } from 'react-router'
import BackIcon from '@material-ui/icons/ArrowBack';
import { Link } from "react-router-dom";
import AppBar from './AppBar';
import MainPage from '../containers/MainPage';
import ProjectPage from './ProjectPage';
import ClientDemoPage from './ClientDemoPage';
import InvocationPage from '../containers/InvocationPage';
import JssProvider from 'react-jss/lib/JssProvider';
import { create } from 'jss';
import { createGenerateClassName, jssPreset } from '@material-ui/core/styles';

const generateClassName = createGenerateClassName();
const jss = create(jssPreset());

const styles = {
  root: {
    flexGrow: 1,
    // backgroundColor: grey[400]
  }
};

export default withStyles(styles)(({ classes }) => {
  return <JssProvider jss={jss} generateClassName={generateClassName}>
    <div className={classes.root}>
      <AppBar />
      {/* Projects, Latest Invocations, Errors, eventually top-level stats (cost, performance) */}
      <Route
        exact
        path="/"
        component={MainPage}
      />
      {/* Project Info (urls, performance), Clients, Functions */}
      <Route
        path="/:project"
        exact
        component={ProjectPage}
      />
      <Route
        path="/invocations/detail/:id"
        component={InvocationPage}
      />
      <Route
        exact
        path="/:project/:client"
        component={ClientDemoPage}
      />
      {/* <Route
        path="/:project/functions/:function/:section"
        component={FunctionPage}
      /> */}
    </div>
  </JssProvider>
});
