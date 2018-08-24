import React from 'react';
import { withStyles } from '@material-ui/core';
import { withRouter } from 'react-router';
import Map from './Map';
import { connect } from 'react-redux';
import { selectExample } from '../actions/examples';
import { ExampleSelect, ReportSidebar } from '@seasketch-sls-geoprocessing/client';
import clients from '../clients';
import {getResults} from '../reducers/results';
import { fetchResults } from '../actions/results';

const styles = theme => ({
  title: {},
  root: {
    width: '100vw',
    height: 'calc(100vh - 64px)',
    display: 'flex'
  }
})

const getExample = (event, examples) => {
  const name = event.target.value;
  return examples.find((e) => e.name === name);
}

class ClientPage extends React.Component {

  componentDidMount() {
    this.fetchResults();
  }

  fetchResults(sketch, sources) {
    this.props.fetchResults(this.props.example.feature, this.props.client.tabs[this.props.selectedTab].sources);
  }

  onTabChange(e) {
    const sketch = getExample(e, this.props.examples);
    const sources = this.props.client.tabs[this.props.selectedTab].sources;
    this.props.onExampleChange(sketch);
    const results = this.props.getResults(sketch.feature)
    if (!results || results.length === 0 || results[0].status === 'failed') {
      this.props.fetchResults(sketch.feature, sources);
    }
  }

  render() {
    const { match, location, history, classes, example, examples, selectedExample, onExampleChange, results, client, selectedTab } = this.props;
    return (
      <div className={classes.root}>
        <ExampleSelect examples={examples} example={selectedExample} onChange={this.onTabChange.bind(this)} />
        <Map example={example} />
        <ReportSidebar client={client} sketch={example.feature} results={results} title={example.feature.properties.name || example.name} selectedTab={selectedTab} open />
      </div>  
    )    
  }
}

const mapStateToProps = (state, ownProps) => {
  const client = clients.find((c) => c.name === ownProps.match.params.clientName);
  const example = state.examples.items.find((e) => e.name === state.examples.selected) || state.examples.items[0];
  const selectedTab = 0;
  const sources = client.tabs[selectedTab].sources;
  const results = getResults(example.feature, sources, state.results);

  return {
    example: example,
    examples: state.examples.items,
    selectedExample: state.examples.selected,
    results: state.results,
    client: client,
    results: results,
    selectedTab: selectedTab,
    getResults: (sketch) => getResults(sketch, sources, state.results)
  }
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onExampleChange: (e) => dispatch(selectExample(e)),
  fetchResults: (sketch, sources) => dispatch(fetchResults(sketch, sources))
});

export default connect(mapStateToProps, mapDispatchToProps)(
  withRouter(withStyles(styles)(ClientPage))
);