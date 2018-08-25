import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import InvocationsList from '../components/InvocationsList';

const styles = theme => ({
  root: {
    width: '95%',
    marginTop: theme.spacing.unit * 3,
    overflowX: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  table: {
    minWidth: 700,
  },
});

class MainPage extends React.Component {

  render() {
    const { classes, history, projects, invocations } = this.props;
    return (
      <React.Fragment>
        <Paper className={classes.root}>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>last updated</TableCell>
                <TableCell>functions</TableCell>
                <TableCell>clients</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map(({name, clients, updatedAt}) => {
                var functions = 0;
                if (clients && clients.modules) {
                  for (var client of clients.modules) {
                    for (var tab of client.tabs) {
                      functions += tab.sources.length
                    }
                  }  
                }
                return (
                  <TableRow key={name} style={{ cursor: 'pointer' }} onClick={() => history.push(`/${name}`)}>
                    <TableCell>{name}</TableCell>
                    <TableCell>{updatedAt ? updatedAt.toLocaleString() : ''}</TableCell>
                    <TableCell>{functions}</TableCell>
                    <TableCell>{clients ? clients.modules.length : 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
        <Paper className={classes.root}>
          <InvocationsList invocations={invocations} onClick={(invocation) => history.push(`/invocations/detail/${invocation.uuid}`)} />
        </Paper>
      </React.Fragment>
    );
  }
}

MainPage.propTypes = {
  classes: PropTypes.object.isRequired,
  projects: PropTypes.arrayOf(PropTypes.object)
};

const mapStateToProps = (state, ownProps) => ({
  projects: state.projects.sort((a, b) => b.updatedAt - a.updatedAt),
  invocations: Object.values(state.invocations).sort((a, b) => b.requestedAt - a.requestedAt)
})

export default withRouter(withStyles(styles)(connect(mapStateToProps)(MainPage)));
