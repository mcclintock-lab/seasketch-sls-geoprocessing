import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import InvocationList from './InvocationList';
import Tabs, { Tab } from '@material-ui/core/Tabs';
import AppBar from '@material-ui/core/AppBar';
import { Route } from "react-router-dom";
import MapInput from './MapInput';
import Card, { CardHeader, CardMedia, CardContent, CardActions } from '@material-ui/core/Card';
import { CircularProgress } from '@material-ui/core/CircularProgress';
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from '@material-ui/core/ExpansionPanel';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InvocationStatus from './InvocationStatus';

const sortByRequestedAt = (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()

const styles = theme => ({
  invocationStatus: {
    maxWidth: 1280,
    // minWidth: 300,
    height: 'auto',
    margin: 10
  },
  root: {
    margin: '20px auto',
    // padding: 20,
    width: '100%',
    maxWidth: 1280,
    textAlign: 'left',
    margin: '0 auto'
    // backgroundColor: 'orange',
  },
  json: {
    padding: 20,
    backgroundColor: '#efefef',
    margin: 20
  },
  logHeading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  }
});

class FunctionDebug extends React.Component {
  state = {
    invocation: null,
    invocationID: null
  }

  render() {
    const {name, projectName, center, zoom, classes} = this.props;
    const {params} = this.props.match;
    const {invocation} = this.state;
    return <div>
      <div className={classes.root}>
        <MapInput initialCenter={center} initialZoom={zoom} onInput={this.invoke} />
        {
          invocation && <InvocationStatus className={classes.invocationStatus} invocation={invocation} />
        }
      </div>
    </div>
  }

  invoke = async (feature) => {
    this.setState({
      invocation: {},
      invocationID: null
    });
    const {name, projectName} = this.props;
    const path = `/api/${projectName}/functions/${name}?id=foo`;
    var response;
    if (feature) {
      response = await fetch(path, {method: 'POST', body: JSON.stringify(feature), headers: {'Content-Type': 'application/json'}});
    } else {
      response = await fetch(path);
    }
    const data = await response.json();
    this.setState({
      invocation: data,
      invocationID: data.location
    });
    this.poll(data);
  }

  poll = async (invocation) => {
    if (this.source) {
      this.source.close();
    }
    this.source = new EventSource(invocation.events);
    this.source.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.location === this.state.invocationID) {
        this.setState({
          invocation: data
        });
        if (data.status === 'complete' && data.billedDurationMs) {
          this.source.close();
        }
      }
    }
    this.source.onerror = (e) => {
      throw new Error("Problem with SSE connection");
    }
  }
}

export default withStyles(styles)(FunctionDebug);
