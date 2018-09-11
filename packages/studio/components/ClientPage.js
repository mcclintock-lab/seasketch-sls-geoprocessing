import React from "react";
import { withStyles } from "@material-ui/core";
import { withRouter } from "react-router";
import Map from "./Map";
import { connect } from "react-redux";
import { selectExample } from "../actions/examples";
import {
  ExampleSelect,
  ReportSidebar,
  openReportSidebar,
  changeReportSidebarTab,
  closeReportSidebar,
} from "@seasketch-sls-geoprocessing/client";
import clients from "../clients";
import { getResults } from "../reducers/results";
import { fetchResults } from "../actions/results";

const styles = theme => ({
  title: {},
  root: {
    width: "100vw",
    height: "calc(100vh - 64px)",
    display: "flex"
  }
});

const getExample = (event, examples) => {
  const name = event.target.value;
  return examples.find(e => e.name === name);
};

class ClientPage extends React.Component {
  componentWillMount() {
    const { client, example } = this.props;
    this.props.openReportSidebar(example.feature, client, 0);
    this.fetchResults();
  }

  fetchResults(sketch, sources) {
    this.props.fetchResults(this.props.example.feature, this.props.client.tabs[this.props.selectedTab].sources);
  }

  onChangeTab(id, tab) {
    const sidebar = this.props.reportSidebars.find((s) => s.id === id);
    this.props.onChangeTab(id, tab);
    const sources = sidebar.client.tabs[tab].sources;
    this.props.fetchResults(sidebar.sketch, sources);
  }

  onExampleChange(e) {
    this.props.closeReportSidebar(this.props.example.feature.properties.id);
    const sketch = getExample(e, this.props.examples);
    this.props.onExampleChange(sketch);
    this.props.openReportSidebar(sketch.feature, this.props.client, 0);
    this.props.fetchResults(sketch.feature, this.props.client.tabs[this.props.selectedTab].sources);
  }

  render() {
    const {
      classes,
      example,
      examples,
      selectedExample,
      reportSidebars,
      onChangeTab,
      getResults
    } = this.props;
    return (
      <div className={classes.root}>
        <ExampleSelect
          examples={examples}
          example={selectedExample}
          onChange={this.onExampleChange.bind(this)}
        />
        <Map example={example} />
        {reportSidebars.map(({ selectedTab, sketch, client, position }) => {
          const tab = client.tabs[selectedTab];
          return (
            <ReportSidebar
              key={sketch.properties.id}
              selectedTab={selectedTab}
              onChangeTab={(e, tab) => this.onChangeTab(sketch.properties.id, tab)}
              sketch={sketch}
              client={client}
              position={position}
              results={getResults(sketch, tab.sources)}
              selectedTab={selectedTab}
              open
            />
          );
        })}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const client = clients.find(c => c.name === ownProps.match.params.clientName);
  const example =
    state.examples.items.find(e => e.name === state.examples.selected) ||
    state.examples.items[0];
  const selectedTab = 0;
  const sources = client.tabs[selectedTab].sources;
  const results = getResults(example.feature, sources, state.results);

  return {
    reportSidebars: Object.keys(state.reportSidebars).map(
      k => state.reportSidebars[k]
    ),
    example: example,
    examples: state.examples.items,
    selectedExample: state.examples.selected,
    results: state.results,
    client: client,
    results: results,
    selectedTab: selectedTab,
    getResults: (sketch, sources) => getResults(sketch, sources, state.results)
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onExampleChange: e => dispatch(selectExample(e)),
  closeReportSidebar: (id) => dispatch(closeReportSidebar(id)),
  fetchResults: (sketch, sources) => dispatch(fetchResults(sketch, sources)),
  openReportSidebar: (sketch, client, position) =>
    dispatch(openReportSidebar(sketch, client, position)),
  onChangeTab: (id,tab) => dispatch(changeReportSidebarTab(id, tab))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(withStyles(styles)(ClientPage)));
