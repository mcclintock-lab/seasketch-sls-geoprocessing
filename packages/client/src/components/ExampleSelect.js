import React from "react";
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
    position: 'absolute',
    zIndex: 2,
    left: 8,
    backgroundColor: 'white',
    padding: '0 3px'
  }
});

const ExampleSelect = ({ classes, example, examples, onChange, allowBlank, style, noLabel }) => (
  <FormControl className={classes.formControl} style={style}>
    { !noLabel && <InputLabel htmlFor="example">Examples</InputLabel> }
    <Select
      value={example}
      onChange={onChange}
    >
      { allowBlank && <MenuItem value="" disabled>Examples</MenuItem> }
      {examples.map((e) => (
        <MenuItem key={e.name} value={e.name}>{e.feature.properties.name} ({e.name})</MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default withStyles(styles)(ExampleSelect);