import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import InvocationList from './InvocationList';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import { Route } from "react-router-dom";
import FunctionDebug from './FunctionDebug';
import FunctionInfo from './FunctionInfo';
import RunIcon from '@material-ui/icons/PlayArrow';
import InfoIcon from '@material-ui/icons/Info';

const sortByRequestedAt = (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime()

class FunctionPage extends React.Component {
  state = {
    invocations: [],
    metadata: {}
  }

  render() {
    const {match} = this.props;
    const {params} = this.props.match;
    const {invocations, metadata} = this.state;
    return <div>
      <AppBar position="static" color="default">
        <Tabs
          value={params.section === 'info' ? 0 : 1}
          onChange={this.handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          fullWidth
        >
          <Tab icon={<InfoIcon />} label="Information" />
          <Tab icon={<RunIcon />} label="Invoke" />
        </Tabs>
      </AppBar>
      <FunctionInfo {...metadata}  name={params.function} projectName={params.project} />
    </div>
  }

  componentDidMount() {
    this.fetchMetadata();
  }

  fetchMetadata = async () => {
    const response = await fetch(`/api/${this.props.match.params.project}/functions/${this.props.match.params.function}/metadata`)
    const metadata = await response.json();
    this.setState({
      metadata: metadata
    })
  }

  handleTabChange = (e, value) => {
    if (value === 1) {
      this.props.history.replace(window.location.pathname.replace('/info', '/debug'))
    } else {
      this.props.history.replace(window.location.pathname.replace('/debug', '/info'))
    }
  }

}

export default FunctionPage;
