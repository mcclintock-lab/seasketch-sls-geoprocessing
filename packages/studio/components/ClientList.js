import React from 'react';
import { Link } from "react-router-dom";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { withStyles, Card } from '@material-ui/core';


const styles = (theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    // backgroundColor: theme.palette.background.paper,
    margin: '32px auto'
  },
});


export default withStyles(styles)(({clients, classes}) => (
  <Card className={classes.root}>
    <List component="nav">
      { clients.map(({name, Component}) => (
        
        <ListItem button key={name} component={Link} to={`client/${name}`}>
          <ListItemText primary={name} />
        </ListItem>
      )) }
    </List>
  </Card>
));