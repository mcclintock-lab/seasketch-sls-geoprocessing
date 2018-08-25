import React from "react";
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

const styles = {
  root: {
    margin: 12,
    marginBottom: 14,
    fontSize: 14
  },
  title: {
    marginBottom: 16,
    fontSize: 14
  }
};

const SimpleCard = ({ classes, title, children, headerStyle }) => (
  <Card className={classes.root}>
    <CardContent>
      <Typography style={headerStyle} className={classes.title}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);
        
SimpleCard.propTypes = {
  classes: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired
};

export default withStyles(styles)(SimpleCard);