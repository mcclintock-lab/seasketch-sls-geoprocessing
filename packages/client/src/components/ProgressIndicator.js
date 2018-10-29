import React from 'react';
import HumanizedDuration from './HumanizedDuration';
import LinearProgress from '@material-ui/core/LinearProgress';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';

const EMAIL_NOTIFICATION_PROMPT_THRESHOLD = 1000 * 60 * 5; // 5 minutes

class ProgressIndicator extends React.Component {
  state = {
    ms: 0,
    max: 0,
    started: null,
    overTime: false,
    emailMe: false
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

  // TODO: Display if user is already subscribed from another system, browser session, or ReportSidebar
  onEmailClick = () => {
    const toggle = !this.state.emailMe;
    this.setState({emailMe: toggle});
    if (this.props.toggleEmailMe) {
      this.props.toggleEmailMe(toggle);
    }
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
        {
          this.props.loggedIn && !!this.props.eta && !!this.state.max && this.state.max >= EMAIL_NOTIFICATION_PROMPT_THRESHOLD && <div style={{marginTop: 20}}><Button onClick={this.onEmailClick}><Checkbox
          // onClick={this.onEmailClick}
          checked={this.state.emailMe}
          value="email"
        />Email Me When Finished</Button></div>
        }
      </div>
  }
}

export default ProgressIndicator;