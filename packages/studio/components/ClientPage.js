import React from "react";
import { withStyles } from "@material-ui/core";
import { withRouter } from "react-router";
import Map from "./Map";
import { connect } from "react-redux";
import { selectExample } from "../actions/examples";
import {
  // MapboxMapContext,
  MapContext,
  ExampleSelect,
  ReportSidebar,
  openReportSidebar,
  changeReportSidebarTab,
  closeReportSidebar,
  getResults,
  MapboxMapContext
} from "@seasketch-sls-geoprocessing/client";
import clients from "../clients";

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
  }

  onExampleChange(e) {
    this.props.closeReportSidebar(this.props.example.feature.properties.id);
    const sketch = getExample(e, this.props.examples);
    this.props.onExampleChange(sketch);
    this.props.openReportSidebar(sketch.feature, this.props.client, 0);
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
        <Map example={example} mapRef={(map) => this.mapRef = map} />
        <MapContext.Provider value={MapboxMapContext(this.mapRef)}>
          {reportSidebars.map(({ selectedTab, sketch, client, position }) => {
            const tab = client.tabs[selectedTab];
            const results = getResults(sketch, tab.sources);
            return (
              <ReportSidebar
                key={sketch.properties.id}
                selectedTab={selectedTab}
                onChangeTab={this.handleChangeTab}
                sketch={sketch}
                client={client}
                position={position}
                results={results}
                selectedTab={selectedTab}
                loggedIn={false}
                open
                toggleEmailMe={null}
              />
            );
          })}
        </MapContext.Provider>
      </div>
    );
  }

  handleChangeTab = (e, tab) => {
    this.props.onChangeTab(this.props.reportSidebars[0].sketch.properties.id, tab);
  }
}

const mapStateToProps = (state, ownProps) => {
  const client = clients.find(c => c.name === ownProps.match.params.clientName);
  const example =
    state.examples.items.find(e => e.name === state.examples.selected) ||
    state.examples.items[0];
  const selectedTab = 0;
  const sources = client.tabs[selectedTab].sources;

  return {
    reportSidebars: Object.keys(state.reportSidebars).map(
      k => state.reportSidebars[k]
    ),
    example: example,
    examples: state.examples.items,
    selectedExample: state.examples.selected,
    client: client,
    getResults: (sketch, sources) => getResults(sketch, sources, state.results),
    selectedTab: selectedTab,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onExampleChange: e => dispatch(selectExample(e)),
  closeReportSidebar: (id) => dispatch(closeReportSidebar(id)),
  openReportSidebar: (sketch, client, position) =>
    dispatch(openReportSidebar(sketch, client, position)),
  onChangeTab: (id,tab) => dispatch(changeReportSidebarTab(id, tab))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(withStyles(styles)(ClientPage)));
