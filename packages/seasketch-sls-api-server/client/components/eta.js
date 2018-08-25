import React from 'react';
import moment from 'moment';

class ETA extends React.Component {
  state = {
    ms: 0
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({
        ms: Math.max(this.props.eta - new Date(), 0)
      })
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return <span>{moment.utc(this.state.ms).format("HH:mm:ss")}</span>
  }
}

export default ETA;