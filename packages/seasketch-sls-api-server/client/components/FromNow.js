import React from 'react';
import moment from 'moment';

class FromNow extends React.Component {
  state = {
    now: new Date()
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({now: new Date})
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return moment(this.props.datetime).fromNow();
  }
}

export default FromNow;