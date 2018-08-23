import React from 'react';
import HumanizedDuration from './HumanizedDuration';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';


class ProgressIndicator extends React.Component {
  state = {
    ms: 0,
    max: 0,
    started: null,
    overTime: false
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      if (!this.state.started) {
        this.setState({started: new Date()});
      }
      if (new Date().getTime() - this.state.started.getTime() > 2000) {
        this.setState({overTime: true});
      }
      const msLeft = Math.max(this.props.eta - new Date(), 0);
      if (this.props.eta && !this.state.max) {
        this.setState({
          ms: msLeft,
          max: msLeft
        })
      } else {
        this.setState({
          ms: msLeft
        })  
      }
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
      return <div style={{width: 400, textAlign: 'center', position: 'absolute', top: 100}}>
        {
          !!this.props.eta && !!this.state.max && this.state.max > 500 && <span>Ready in <HumanizedDuration duration={this.state.ms} round /></span>
        }
        <LinearProgress variant={this.props.eta && this.state.max && this.state.ms > 0 ? "determinate" : "indeterminate"} value={100 - Math.round((this.state.ms / this.state.max) * 100)} style={{marginTop: 10}} />
        {
          (this.state.overTime || (!!this.props.eta && !!this.props.logs && this.state.max > 500)) && <div style={{marginTop: 8, fontSize: 14}}><a style={{color: 'grey'}} href={this.props.logs} target="_blank">see logs</a></div>
        }
      </div>
  }
}

export default ProgressIndicator;