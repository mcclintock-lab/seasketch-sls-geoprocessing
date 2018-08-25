import React from "react";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from "@material-ui/core/Avatar";

const sortByRequestedAt = (a, b) =>
  new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
const styles = {
  card: {
    minWidth: 275,
    maxWidth: 600,
    margin: "10px auto"
  },
  bullet: {
    display: "inline-block",
    margin: "0 2px",
    transform: "scale(0.8)"
  },
  title: {
    marginBottom: 16,
    fontSize: 14
  },
  pos: {
    marginBottom: 12
  },
  list: {
    textIndent: "none"
  },
  listItem: {
    paddingLeft: 0
  },
  avatar: {
    float: "left",
    marginRight: 20,
    marginTop: 12
  }
};

class FunctionInfo extends React.Component {
  render() {
    const {
      classes,
      projectName,
      name,
      description,
      outputs,
      region,
      costPerInvocation,
      memorySize,
      stats
    } = this.props;
    const {
      billedDuration50thPercentile,
      invocations,
      averageMemoryUse
    } = stats || {};
    var budget = 1;
    if (costPerInvocation <= 0.001) {
      budget = 1;
    } else if (costPerInvocation <= 0.01) {
      budget = 10;
    } else if (costPerInvocation <= 0.1) {
      budget = 100;
    } else {
      budget = 400;
    }

    const bull = <span className={classes.bullet}>•</span>;
    return (
      <div>
        <Card className={classes.card}>
          <CardContent>
            {/* <Typography className={classes.title} color="textSecondary">
            Runtime Settings
          </Typography> */}
            <Typography variant="headline" component="h2">
              {projectName}-geoprocessing-{name}
            </Typography>
            <List className={classes.list}>
              <ListItem className={classes.listItem}>
                <ListItemText primary="description" secondary={description} />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemText primary="region" secondary={region} />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemText
                  primary="memory size"
                  secondary={memorySize + " MB"}
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemText primary="s3 folder" secondary={outputs} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
        <Card className={classes.card}>
          <CardContent>
            <Avatar aria-label="Recipe" className={classes.avatar}>
              $
            </Avatar>
            <Typography variant="headline" component="p">
              With a budget of ${budget}.00 this function could be invoked{" "}
              {Math.round(budget / costPerInvocation).toLocaleString()} times.
            </Typography>
          </CardContent>
        </Card>
        <Card className={classes.card}>
          <CardContent>
            <Typography className={classes.title} color="textSecondary">
              Performance
            </Typography>
            <List className={classes.list}>
              <ListItem className={classes.listItem}>
                <ListItemText primary="invocations" secondary={invocations} />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemText
                  primary="billed duration (50th percentile)"
                  secondary={billedDuration50thPercentile + " ms"}
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemText
                  primary="average memory use"
                  secondary={averageMemoryUse + " MB"}
                />
              </ListItem>
            </List>

            {/* <Typography variant="headline" component="h2">
            {projectName}-geoprocessing-{name}
          </Typography>
          <List className={classes.list}>
            <ListItem className={classes.listItem}>
              <ListItemText primary="description" secondary={description} />
            </ListItem>
            <ListItem className={classes.listItem}>
              <ListItemText primary="region" secondary={region} />
            </ListItem>
            <ListItem className={classes.listItem}>
              <ListItemText primary="s3 folder" secondary={outputs} />
            </ListItem>
          </List> */}
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default withStyles(styles)(FunctionInfo);
