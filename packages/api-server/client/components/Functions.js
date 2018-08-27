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
    const { classes, history, functions } = this.props;
    return (
      <Paper className={classes.root}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Function</TableCell>
              <TableCell numeric>invocations</TableCell>
              <TableCell numeric>memory size</TableCell>
              <TableCell numeric>memory use (avg)</TableCell>
              <TableCell numeric>billed duration (50th percentile)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {functions.map(n => {
              return (
                <TableRow key={n.functionName} style={{ cursor: 'pointer' }} onClick={() => history.push(`/${n.projectName}/functions/${n.name}/info`)}>
                  <TableCell>{n.functionName}</TableCell>
                  <TableCell numeric>{n.invocations}</TableCell>
                  <TableCell numeric>{n.memorySize}</TableCell>
                  <TableCell numeric>{n.averageMemoryUse}</TableCell>
                  <TableCell numeric>{n.billedDuration50thPercentile}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  onFunctionClick(func) {
    console.log(func);
  }
}

SimpleTable.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = (state, ownProps) => ({
  functions: state.projects.reduce((f, p) => [...f, ...p.functions], [])
})

export default withStyles(styles)(connect(mapStateToProps)(SimpleTable));
