import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { withStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import Avatar from "@material-ui/core/Avatar";
import ErrorIcon from "@material-ui/icons/ReportProblem";
import PropTypes from "prop-types";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
import MenuIcon from "@material-ui/icons/Menu";
import ProgressIndicator from './ProgressIndicator';
import { versionSatisfied, CLIENT_VERSION, PACKAGING_VERSION } from '../versions';
import Card from "./Card";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';

const styles = theme => ({
  root: {
    height: "calc(100% + 10px)",
    width: 500,
    zIndex: 10,
    marginTop: -10,
    backgroundColor: "#efefef"
  },
  appBar: {
    marginBottom: 0,
    zIndex: 2,
    position: "relative"
  },
  tabContentContainer: {
    overflowY: "scroll",
    maxHeight: "calc(100% - 112px)",
    position: 'relative'
  },
  tabContentContainerLoading: {
    overflowY: "scroll",
    maxHeight: "calc(100% - 112px)",
    minHeight: "calc(100% - 112px)",
    display: "flex",
    justifyContent: "center" /* align horizontal */,
    alignItems: "center", /* align vertical */
    position: "relative"
  },
  progress: {
    // margin: '30px auto 0px 45%'
  },
  errorAvatar: {
    backgroundColor: "#ff5500",
    margin: "10px auto"
  },
  errorContainer: {
    textAlign: "center"
  },
  flex: {
    flexGrow: 1,
  }
});

class ReportSidebar extends React.Component {
  state = {
    anchorEl: null
  };

  render() {
    let {
      clientError,
      classes,
      title,
      client,
      selectedTab,
      sketch,
      results,
      open,
      menuItems,
      style,
      tabContentContainerStyle
    } = this.props;
    const { anchorEl } = this.state;
    if (!title && sketch && sketch.properties) {
      title = sketch.properties.name || sketch.properties.NAME;
    }
    const clientLoaded = client && !clientError;
    const loaded =
      !clientError &&
      client &&
      results &&
      results.filter(r => r.status === "complete").length === results.length;

    results = results || [];
    const failed = results.filter(r => r.status === "failed");
    const complete = results.filter(r => r.status === "complete");
    const resultsBySource = results.reduce((o, result) => {
      o[`${result.project}-geoprocessing-${result.function}`] = result.results;
      return o;
    }, {});
    var ReportTab;
    if (client && client.tabs && client.tabs.length) {
      ReportTab = client.tabs[0];
    }


    return (
      <Paper
        className={classes.root}
        style={{ display: !open ? "none" : "block", ...style }}
        elevation={13}
      >
        <AppBar position="static" color="default" className={classes.appBar}>
          <Toolbar style={{paddingRight: 8}}>
            <Typography
              variant="title"
              color="inherit"
              className={classes.flex}
              style={{maxWidth: 373}}
            >
              {title}
            </Typography>
            {menuItems &&
              menuItems.length > 0 && (
                <div>
                  <IconButton
                    aria-owns={anchorEl ? "menu-appbar" : null}
                    aria-haspopup="true"
                    onClick={this.handleMenu}
                    color="inherit"
                  >
                    <MenuIcon />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right"
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right"
                    }}
                    open={!!anchorEl}
                    onClose={this.handleClose}
                  >
                    {menuItems.map(item => {
                      return (
                        <MenuItem
                          key={item.label}
                          onClick={() => {
                            this.handleClose();
                            item.onClick && item.onClick();
                          }}
                        >
                          {item.label}
                        </MenuItem>
                      );
                    })}
                  </Menu>
                  {
                    this.props.rightButtons
                  }
                </div>
              )}
          </Toolbar>
          {client && client.tabs && sketch ? (
            <Tabs value={selectedTab}>
              {client.tabs.map(client => (
                <Tab key={client.title} label={client.title} />
              ))}
            </Tabs>
          ) : null}
        </AppBar>
        <div
          className={
            !loaded || failed.length
              ? classes.tabContentContainerLoading
              : classes.tabContentContainer
          }
          style={tabContentContainerStyle}
        >
          {!clientLoaded && <CircularProgress className={classes.progress} />}
          {clientError && (
            <div className={classes.errorContainer}>
              <Avatar className={classes.errorAvatar}>
                <ErrorIcon />
              </Avatar>
              {clientError}
            </div>
          )}
          {failed.length > 0 && (
            <div className={classes.errorContainer}>
              <Avatar className={classes.errorAvatar}>
                <ErrorIcon />
              </Avatar>
              Error analyzing Sketch
              {
                results && results[0] && results[0].logPage && <div style={{marginTop: 8, fontSize: 14}}><a style={{color: 'grey'}} href={results[0].logPage} target="_blank">see logs</a></div>
              }

            </div>
          )}
          {!sketch && clientLoaded && "Choose a sketch to display reports"}
          {loaded && clientLoaded && versionSatisfied(client) &&
            results.length === client.tabs[selectedTab].sources.length && complete.length === results.length && (
              <ReportTab sketch={sketch} results={resultsBySource} />
            )}
          {
            loaded && !versionSatisfied(client) && (
              <Card title="Client Dependency Problem">
                <List subheader={<ListSubheader>Current Versions</ListSubheader>}>
                  <ListItem>
                    <ListItemText primary="@seasketch-sls-geoprocessing/client" />
                    <ListItemSecondaryAction>
                      <Typography variant="body2">{CLIENT_VERSION}</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="@seasketch-sls-geoprocessing/packaging" />
                    <ListItemSecondaryAction>
                    <Typography variant="body2">{PACKAGING_VERSION}</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                <List subheader={<ListSubheader>Required Versions</ListSubheader>}>
                  <ListItem>
                    <ListItemText primary="@seasketch-sls-geoprocessing/client" />
                    <ListItemSecondaryAction>
                    <Typography variant="body2">{client.requiredClientVersion}</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="@seasketch-sls-geoprocessing/packaging" />
                    <ListItemSecondaryAction>
                    <Typography variant="body2">{client.requiredPackagingVersion}</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Card>
            )
          }
          {complete.length < results.length &&
            !clientError &&
            !failed.length && <ProgressIndicator eta={results[0].eta} logs={results[0].logPage} />}
        </div>
      </Paper>
    );
  }

  handleMenu = (e) => {
    this.setState({anchorEl: e.target});
  }

  handleClose = () => {
    this.setState({anchorEl: null})
  }
}
ReportSidebar.propTypes = {
  // if not specified, assumes client is loading
  client: PropTypes.object,
  // in the case of client loading failure
  clientError: PropTypes.string,
  sketch: PropTypes.object,
  results: PropTypes.arrayOf(PropTypes.object),
  selectedTab: PropTypes.number,
  // optional, defaults to sketch.properties.name
  title: PropTypes.string,
  // defaults to false
  open: PropTypes.bool.isRequired,
  closeable: PropTypes.bool,
  menuItems: PropTypes.arrayOf(PropTypes.object)
};

ReportSidebar.defaultProps = {
  selectedTab: 0,
  open: false,
  closeable: false,
  menuItems: []
};

export default withStyles(styles)(ReportSidebar);
