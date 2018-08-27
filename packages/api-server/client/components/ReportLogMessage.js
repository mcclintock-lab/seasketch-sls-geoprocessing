import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { scrolled } from 'react-stay-scrolled';

const baseLogStyle = {
  borderBottom: '1px solid rgba(0,0,0,0.1)',
  fontFamily: 'monospace',
  fontSize: 12
};

const styles = theme => ({
  info: {
    ...baseLogStyle,
    borderLeft: '4px solid orange',
    padding: 2,
    backgroundColor: '#fffef7',
    '&:before': {
      position: 'relative',
      bottom: 0,
      content: "'λ'",
      padding: 2,
      position: 'relative',
      marginRight: 4,
    }
  },
  command: {
    ...baseLogStyle,
    padding: '2px 0',
    backgroundColor: '#f1f1f1',
    borderLeft: '4px solid #b3b3b3',
    '&:before': {
      position: 'relative',
      bottom: 0,
      content: "'$'",
      padding: 2,
      position: 'relative',
      marginRight: 4,
    }
  },
  stdout: {
    ...baseLogStyle,
    padding: '2px 0',
    backgroundColor: '#f1f1f1',
    borderLeft: '4px solid #b3b3b3',
    paddingLeft: 14
  },
  stderr: {
    ...baseLogStyle,
    padding: '2px 0',
    backgroundColor: '#faecec',
    borderLeft: '4px solid red',
    paddingLeft: 14
  },
  stackTraceListItem: {
    listStyle: 'none',
    textIndent: 10
  },
  last: {
    borderTop: "1px solid black",
    borderBottom: "1px solid black"
  }
});

class ReportLogMessage extends React.Component {

  render() {
    const {message, id, type, classes, last} = this.props;
    var msgStr = message.replace("\n", "<br />");
    if (/"errorType":"Error"/.test(message)) {
      var errData = JSON.parse(message.substr(message.indexOf("{")));
      msgStr = <div style={{marginBottom: 20}}>
        <h4>Error: {errData.errorMessage}</h4>
        {
          errData.stackTrace.map((s, i) => <li key={id + 'stack' + i} className={classes.stackTraceListItem}>at {s}</li>)
        }
      </div>
      // msgStr = <pre>{JSON.stringify(msgStr)}</pre>
    }
    return (
      <div key={id} className={[classes[type], last ? classes["last"] : ""].join(" ")}>
        {msgStr}
      </div>
    )
  }

  componentDidMount() {
    const { stayScrolled, scrollBottom } = this.props;

    // Make the parent StayScrolled component scroll down if it was already scrolled
    stayScrolled();

    // Make the parent StayScrolled component scroll down, even if not completely scrolled down
    // scrollBottom();
  }
}


export default scrolled(withStyles(styles)(ReportLogMessage));
