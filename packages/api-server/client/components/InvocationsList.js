import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import FromNow from './FromNow';
import ErrorIcon from "@material-ui/icons/ReportProblem";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = theme => ({

});

const InvocationsList = ({invocations, classes, onClick}) => {
  return <Table className={classes.table}>
    <TableHead>
      <TableRow>
        <TableCell>Project</TableCell>
        <TableCell>Function</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Requested</TableCell>
        <TableCell>Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {
        invocations.map((i) => (
          <TableRow key={i.uuid} onClick={onClick.bind(null, i)} style={{cursor: 'pointer'}}>
            <TableCell>{i.project}</TableCell>
            <TableCell>{i.function}</TableCell>
            <TableCell>{i.amiHandler ? 'ec2' : 'lambda'}</TableCell>
            <TableCell><FromNow datetime={i.requestedAt} /></TableCell>
            <TableCell style={{color: i.status === 'failed' ? 'red' : null}}>
              {i.status === 'failed' && <ErrorIcon style={{fontSize: 16, marginRight: 2, marginBottom: -3, color: 'red'}} />}
              {(i.status === 'running' || i.status === 'worker-running' || i.status === 'worker-booting') && <CircularProgress size={13} style={{marginRight: 3, bottom: -2, position: 'relative'}} />}
              {i.status}
            </TableCell>
          </TableRow>
        ))
      }
    </TableBody>
  </Table>
};

export default withStyles(styles)(InvocationsList);