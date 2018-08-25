import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import InvocationStatus from '../components/InvocationStatus';
import { fetchInvocation } from '../actions/invocations';
import { CircularProgress } from '@material-ui/core';

const styles = theme => ({

});

class InvocationPage extends React.Component {
  componentDidMount() {
    // if (!this.props.invocation) {
      this.props.fetchInvocation(this.props.uuid);
    // }
  }
  
  render() {
    const { invocation, project } = this.props;
    if (invocation && project && this.props.function) {
      return <InvocationStatus func={this.props.function} invocation={this.props.invocation} />
    } else {
      return <CircularProgress />
    }
  }
}


const mapStateToProps = (state, ownProps) => {
  const invocation = state.invocations[ownProps.match.params.id];
  const project = state.projects.find((p) => p.name === (invocation || {}).project);
  return {
    uuid: ownProps.match.params.id,
    invocation: invocation,
    project,
    function: invocation && project ? project.functions.find((f) => f.name === invocation.function) : null
  }
}

const mapDispatchToProps = (dispatch) => ({
  fetchInvocation: (id) => dispatch(fetchInvocation(id))
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(withRouter(InvocationPage)));