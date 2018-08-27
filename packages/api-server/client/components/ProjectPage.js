import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withRouter } from 'react-router';
import Grid from '@material-ui/core/Grid';
import GithubSVG from "../assets/github.svg";
import IconButton from '@material-ui/core/IconButton';
import Icon from '@material-ui/core/Icon';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import filesize from "filesize";
import BundleIcon from '@material-ui/icons/cardgiftcard';
import FunctionDetails from './FunctionDetails';

const GithubIcon = ({className, style}) => <span className={className} style={{...style, width: 24, height: 24}} dangerouslySetInnerHTML={{__html: GithubSVG}}></span>

const styles = theme => ({
  metadata: {
    width: 'calc(100% - 20px)',
    overflowX: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: 10
  },
  table: {
    // minWidth: 700,
  },
  progress: {
    marginTop: 100,
    marginLeft: '45%'
  },
  button: {

  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  gridItem: {
    // height: 20,
    textAlign: 'center'
  },
  card: {
    width: 340,
    maxWidth: "80%",
    height: "auto",
    float: 'left',
    margin: 20
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

class ProjectPage extends React.Component {

  render() {
    const { bundleSize, classes, name, clients, noProjects, history, match, functions, updatedAt, region, git} = this.props;
    if (noProjects) {
      return <CircularProgress className={classes.progress} />
    }
    return (
      <React.Fragment>
        <Paper className={classes.metadata}>
          <Grid container spacing={0}>
            <Grid className={classes.gridItem} item sm={4} xs={12}>
              <Typography component="p">
                <Button href={git} style={{padding: "8px 16px 8px 16px"}} className={classes.button} aria-label="github" disabled>
                Updated {updatedAt ? updatedAt.toLocaleString() : "Unknown"}
                </Button>
              </Typography>
            </Grid>
            {
              bundleSize && (
                <React.Fragment>
                  <Grid className={classes.gridItem} item sm={4} xs={12}>
                    <Button href={clients.bundle} className={classes.button} aria-label="js bundle">
                      <BundleIcon className={classes.leftIcon} />
                      {clients.bundle.split('/').slice(-1)}  - {filesize(bundleSize)}
                    </Button>
                  </Grid>
                  <Grid className={classes.gridItem} item sm={4} xs={12}>
                    <Button href={clients.apiServerBundle} className={classes.button} aria-label="js bundle">
                      <BundleIcon className={classes.leftIcon} />
                      {clients.apiServerBundle.split('/').slice(-1)}
                    </Button>
                  </Grid>
                </React.Fragment>
              )
            }
            {
              git && (
                <Grid className={classes.gridItem} item sm={4} xs={12}>
                  <Typography component="p">
                    <Button href={git} className={classes.button} aria-label="github">
                      <GithubIcon className={classes.leftIcon} />
                      {git.match(/([\w-]+\/[\w-]*).git/)[1]}
                    </Button>
                  </Typography>
                </Grid>
              )
            }
          </Grid>
        </Paper>
        {
          clients && clients.modules.map((client) => (
            <Card className={classes.card} key={client.title}>
              <CardContent>
                <Typography variant="headline" component="h2">
                  {client.title}
                </Typography>
                <Typography className={classes.pos} color="textSecondary">
                  Client, {client.tabs.length} tab{client.tabs.length !== 1 ? "s" : ''}
                </Typography>
              </CardContent>
              <CardActions>
                <Button color="primary" size="small" href={`/${name}/${client.title}`}>Demo</Button>
              </CardActions>
            </Card>
          ))
        }
        {
          functions.map((func) => (
            <Card key={func.name} className={classes.card}>
              <CardContent>
                <Typography variant="headline" component="h2">
                  {func.name}
                </Typography>
                <Table className={classes.table}>
                  <TableBody>
                    <FunctionDetails {...func} />
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        }
      </React.Fragment>
      // <Paper className={classes.root}>
      //   <Table className={classes.table}>
      //     <TableHead>
      //       <TableRow>
      //         <TableCell>Client Name</TableCell>
      //         <TableCell numeric>tabs</TableCell>
      //         <TableCell numeric>sources</TableCell>
      //       </TableRow>
      //     </TableHead>
      //     <TableBody>
      //       {clients.modules.map(({title, tabs}) => {
      //         const numTabs = tabs.length || 0;
      //         const functions = (tabs || []).reduce((sum, t) => {sum += t.sources.length; return sum}, 0);
      //         return (
      //           <TableRow key={title} style={{ cursor: 'pointer' }} onClick={() => history.push(`/${match.params.project}/${title}`)}>
      //             <TableCell>{title}</TableCell>
      //             <TableCell numeric>{numTabs}</TableCell>
      //             <TableCell numeric>{functions}</TableCell>
      //           </TableRow>
      //         );
      //       })}
      //     </TableBody>
      //   </Table>
      // </Paper>
    );
  }

}

ProjectPage.propTypes = {
  classes: PropTypes.object.isRequired
};

const mapStateToProps = (state, ownProps) => {
  const project = state.projects.find((p) => p.name === ownProps.match.params.project)
  return {
    ...project,
    noProjects: state.projects.length === 0
  }
};

export default withRouter(withStyles(styles)(connect(mapStateToProps)(ProjectPage)));
