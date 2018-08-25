import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import ExpansionPanel, {
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from '@material-ui/core/ExpansionPanel';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import JSONTree from 'react-json-tree';
import IconButton from '@material-ui/core/IconButton';
import CopyIcon from '@material-ui/icons/FileCopy';
import DownloadIcon from '@material-ui/icons/CloudDownload';
import StayScrolled from 'react-stay-scrolled';
import ReportLogMessage from './ReportLogMessage';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import moment from 'moment';
import CardHeader from '@material-ui/core/CardHeader';
import Tooltip from '@material-ui/core/Tooltip';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import {lambdaCost, ec2Cost} from '../calculateCost';
import PayloadMap from './PayloadMap';
import ETA from './eta';
import ErrorIcon from "@material-ui/icons/ReportProblem";
import {HumanizedDuration} from '@seasketch-sls-geoprocessing/client';
import CircularProgress from '@material-ui/core/CircularProgress';

const copyResults = () => {
  var copyText = document.getElementById("results-clip-area");
  copyText.select();
  document.execCommand("copy");
}

const copyLink = (url) => {
  var copyText = document.getElementById("results-clip-area");
  copyText.value = url;
  copyText.select();
  document.execCommand("copy");
}

const jsonTheme = {
  scheme: 'bright',
  author: 'chris kempson (http://chriskempson.com)',
  base00: '#000000',
  base01: '#303030',
  base02: '#505050',
  base03: '#b0b0b0',
  base04: '#d0d0d0',
  base05: '#e0e0e0',
  base06: '#f5f5f5',
  base07: '#ffffff',
  base08: '#fb0120',
  base09: '#fc6d24',
  base0A: '#fda331',
  base0B: '#a1c659',
  base0C: '#76c7b7',
  base0D: '#6fb3d2',
  base0E: '#d381c3',
  base0F: '#be643c'
};


const styles = theme => ({
  logListContainer: {
    padding: '10px 20px',
    maxHeight: 600,
    overflowY: 'scroll',
    overflowX: 'hidden',
    marginBottom: 20
  },
  copyButton: {
    display: 'block',
    position: 'absolute',
    left: 120,
    top: 0
  },
  content: {
    position: 'relative'
  },
  paper: {
    padding: theme.spacing.unit * 2
  },
  dt: {
    paddingLeft: 0,
    paddingRight: 0
  },
  dd: {
    paddingRight: "4px !important",
    color: theme.palette.text.secondary
  }
});

const titles = {
  requested: "Requested",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  "worker-booting": "Worker Booting",
  "worker-running": "Worker Running"
};


const InvocationStatus = ({ invocation, func, project, classes, ...props }) => {
  var statusTitle = "Running";
  const logs = invocation.logs || [];
  var splitLogs = [];
  for (var log of logs) {
    var i = 0;
    for (let msg of log.message.split("\n")) {
      if (msg.length) {
        splitLogs.push({
          ...log,
          message: msg,
          id: log.id + i
        });
      }
      i++;
    }
  }

  const mailtoBody = encodeURI(`Please describe the error below:
  
  -------------------------------------------------------------------------------
  This bug report is regarding a report function invocation at 
  ${window.location.href}
  -------------------------------------------------------------------------------
  `);

  let totalCost = null;
  if (invocation.closed && invocation.billedDurationMs) {
    totalCost = lambdaCost(invocation.memorySizeMb, invocation.billedDurationMs);
    if (invocation.amiHandler) {
      totalCost += ec2Cost(invocation.pricePerHour || func.pricePerHour, invocation.duration);
    }
  }


  return (
    <div style={{padding: 16}}>
    <Grid container spacing={16} justify="center">
      <Grid item xs={12}>
        <Card className={classes.paper}>
          <CardContent>
          <Typography variant="headline">{[invocation.project, 'geoprocessing', invocation.function].join("-")}</Typography>
          <br />
          <Typography variant="title" style={{color: invocation.status === 'failed' ? 'red' : null}}>
            {titles[invocation.status]}
            {
              invocation.status === 'failed' && <ErrorIcon style={{marginLeft: 6, marginBottom: -4, color: 'red'}} />
            }
          </Typography>
          <Typography variant="subheading" color="textSecondary">
            requested {invocation.requestedAt.toLocaleString()}
          </Typography>
          {
            invocation.deliveredAt ? (
              <Typography variant="subheading" color="textSecondary">
                finished {invocation.deliveredAt.toLocaleString()}
              </Typography>
            ) : null
          }
          {
            invocation.status !== 'complete' && invocation.status !== 'failed' && invocation.eta ? (
              <Typography variant="subheading" color="textSecondary">
                eta <ETA eta={invocation.eta} />
              </Typography>
            ) : null
          }
          </CardContent>
          <CardActions>
            <Button color="primary" onClick={() => copyLink(window.location.href)}>Copy Link</Button>
            <Button href={`/${invocation.project}`} color="primary">View Project</Button>
            <Button target="_blank" href={`mailto:support@seasketch.org?subject=Report%20Error&body=${mailtoBody}`} color="primary">Request Support</Button>
          </CardActions>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card style={{minHeight: 240, height: '100%', opacity: invocation.status === 'failed' ? 0.6 : null}}>
          <CardHeader
            action={ invocation.results && 
              <Tooltip title="Copy Results">
              <IconButton onClick={copyResults}>
                <CopyIcon style={{ width: 18 }} />  
              </IconButton>
              </Tooltip>
            }
            title="Results"
            subheader={ invocation.status === 'failed' ? 'None' : invocation.status === 'complete' ? "" : "pending..."}
          />
          {
            invocation.results && (
              <React.Fragment>
                <CardContent style={{paddingTop: 0}}>
                  <JSONTree theme={jsonTheme} data={invocation.results} />
                </CardContent>
                <textarea id="results-clip-area" style={{ position: 'absolute', left: -1000 }} readOnly value={JSON.stringify(invocation.results)}></textarea>
              </React.Fragment>
            )
          }
          {
            invocation.status === 'failed' && (
              <div />        
            )
          }
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card style={{overflow: 'hidden'}}>
          <CardHeader
            title="Payload"
            action={
              <Tooltip title="Download GeoJSON">
              <IconButton href={invocation.payload} target="_blank" download>
                <DownloadIcon style={{ width: 18 }} />  
              </IconButton>
              </Tooltip>
            }
          />
          <Typography variant="subheading" color="textSecondary" style={{marginLeft: 24, marginBottom: 10}}>
            {invocation.payloadSizeBytes ? `${Math.round(invocation.payloadSizeBytes)} bytes ${ invocation.sketchId ? "sketch" : "geojson"}` : null}
          </Typography>
          <PayloadMap url={invocation.payload} />
        </Card>
      </Grid>
      <Grid item xs={12} sm={12} md={4}>
        <Card style={{height: '100%'}}>
          <CardHeader
            title="Resources"
          />
          <CardContent style={{paddingTop: 0}}>
            <Table className={classes.table}>
              <TableBody>
                <TableRow>
                  <TableCell scope="row" className={classes.dt}>
                    Function Type
                  </TableCell>
                  <TableCell numeric className={classes.dd}>{invocation.amiHandler ? "ec2" : "lambda"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" className={classes.dt}>
                    Cost
                  </TableCell>
                  <TableCell numeric className={classes.dd}>
                  {totalCost ? totalCost < 0.1
                    ? `$1.00 pays for ${Math.round(1 / totalCost)} runs`
                    : `\$${Math.round(totalCost * 100) / 100}` : <CircularProgress size={18} />}
                  </TableCell>
                </TableRow>
                {
                  invocation.amiHandler ? (
                    <React.Fragment>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Launch Template
                        </TableCell>
                        <TableCell numeric className={classes.dd}>
                          {func.launchTemplate}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Timeout
                        </TableCell>
                        <TableCell numeric className={classes.dd}>
                          <HumanizedDuration duration={func.workerTimeout * 1000 * 60} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Duration
                        </TableCell>
                        <TableCell numeric className={classes.dd}>
                          {invocation.closed ? <HumanizedDuration duration={invocation.duration} /> : <CircularProgress size={18} />}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Timeout
                        </TableCell>
                        <TableCell numeric className={classes.dd}>
                          <HumanizedDuration duration={func.timeout * 1000} />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Memory Size
                        </TableCell>
                        <TableCell numeric className={classes.dd}>{func.memorySize} MB</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Max Memory Used
                        </TableCell>
                        <TableCell numeric className={classes.dd}>
                          {invocation.maxMemoryUsedMb ? `${invocation.maxMemoryUsedMb} MB` : <CircularProgress size={18} />}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell scope="row" className={classes.dt}>
                          Billed Duration
                        </TableCell>
                        <TableCell numeric className={classes.dd}>
                          {invocation.billedDurationMs ? <HumanizedDuration duration={invocation.billedDurationMs} /> : <CircularProgress size={18} />}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>

                  )
                }
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Paper className={classes.paper}>
          <Typography variant="headline">Logs</Typography>
          <br />
          <StayScrolled className={classes.logListContainer} component="div">
            {
              splitLogs.map((l) => (
                <ReportLogMessage key={l.id} {...l} />
              ))
            }
            {
              !invocation.closed && (
                <div className={classes.logSpinner}>
                  <LinearProgress style={{ height: 2 }} />
                </div>
              )
            }
          </StayScrolled>
        </Paper>
      </Grid>
    </Grid>
    </div>
  )
};

export default withStyles(styles)(InvocationStatus);
