import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

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

class SimpleTable extends React.Component {

  render() {
    const { classes, history, projects } = this.props;
    return (
      <Paper className={classes.root}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell numeric>functions</TableCell>
              <TableCell numeric>clients</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map(({name, clients}) => {
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
                  <TableCell numeric>{functions}</TableCell>
                  <TableCell numeric>{clients ? clients.modules.length : 0}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    );
  }
}

SimpleTable.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = (state, ownProps) => ({
  projects: state.projects
})

export default withStyles(styles)(connect(mapStateToProps)(SimpleTable));
