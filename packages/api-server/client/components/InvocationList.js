import React from 'react';
import Table, { TableBody, TableCell, TableHead, TableRow } from '@material-ui/core/Table';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import { CircularProgress } from '@material-ui/core/CircularProgress';

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    overflowX: 'auto',
  },
  table: {
    minWidth: 700,
  },
});


module.exports = withStyles(styles)(({invocations, onClick, classes}) => (
  <Paper className={classes.root}>
    <Table className={classes.table}>
      <TableHead>
        <TableRow>
          <TableCell>Requested At</TableCell>
          <TableCell>Status</TableCell>
          <TableCell numeric>Payload Size (bytes)</TableCell>
          <TableCell numeric>Billed Duration (ms)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invocations.map(i => {
          return (
            <TableRow key={i.location}>
              <TableCell>{i.requestedAt}</TableCell>
              <TableCell>{i.status} {!i.billedDurationMs && <span>{i.status === 'complete' && '(waiting for logs)'}<CircularProgress color="grey" size={20} /></span>}</TableCell>
              <TableCell numeric>{i.payloadSizeBytes}</TableCell>
              <TableCell numeric>{i.billedDurationMs}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Paper>
))
