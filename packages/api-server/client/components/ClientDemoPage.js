import React from "react";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core";
import { withRouter } from "react-router";
import Map from "./MapInput";
import { connect } from "react-redux";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
  fetchClients,
  ExampleSelect,
  ReportSidebar,
  getResults,
  changeReportSidebarTab,
  openReportSidebar,
  closeReportSidebar,
  clearSidebars
} from "@seasketch-sls-geoprocessing/client";
import {
  setFetchTokenFunction
} from "@seasketch-sls-geoprocessing/client";
import uuid from "uuid/v4";

setFetchTokenFunction(async () => {
  return localStorage.token;
});

const styles = theme => ({
  title: {},
  root: {
    width: "100vw",
    height: "calc(100vh - 64px)",
    display: "flex"
  },
  progress: {
    marginTop: 100,
    marginLeft: "45%"
  }
});

class ClientDemoPage extends React.Component {
  state = {
    sketch: null,
    exampleName: ""
  };

  componentDidMount() {
    this.fetchClient();
  }

  fetchClient = async () => {
    if (this.props.project) {
      this.props.fetchClients(
        this.props.project.name,
        this.props.project.clients.apiServerBundle
      );
    }
  };

  openSidebar(sketch, client) {
    this.props.clearSidebars();
    this.props.openReportSidebar(sketch, client, 0, 0);
  }

  componentDidUpdate(prevProps) {
    if (
      !this.props.client &&
      !this.props.clientLoading &&
      !this.props.clientError
    ) {
      this.fetchClient();
    }
    if (
      !prevProps.examples &&
      !!this.props.examples &&
      this.props.examples.length
    ) {
      const example = this.props.examples[0];
      this.setState({
        exampleName: example.name,
        sketch: example.feature
      });
      this.openSidebar(example.feature, this.props.client);
    }
  }

  onInput = feature => {
    feature.properties = {
      name: "DrawnFeature",
      id: uuid()
    };
    this.setState({
      sketch: feature
    });
    this.openSidebar(feature, this.props.client);
  };

  onExampleChange = e => {
    const example = this.props.examples.find(ex => ex.name === e.target.value);
    this.setState({
      sketch: example.feature,
      exampleName: e.target.value
    });
    this.openSidebar(example.feature, this.props.client);
  };

  render() {
    const {
      project,
      classes,
      reportSidebars,
      examples,
      getResults
    } = this.props;
    if (!project) {
      return <CircularProgress className={classes.progress} />;
    }
    var example = null;
    if (this.state.exampleName) {
      example = examples.find(e => e.name === this.state.exampleName).feature;
    }
    return (
      <div className={classes.root}>
        <ExampleSelect
          style={{ left: 60 }}
          examples={examples || []}
          example={this.state.exampleName}
          onChange={this.onExampleChange}
          allowBlank
          noLabel
        />
        <Map
          example={example}
          initialCenter={project.center}
          initialZoom={project.zoom}
          onDrawModeChange={this.onDrawModeChange}
          onInput={this.onInput}
        />
        {reportSidebars.map(({ selectedTab, sketch, client, position }) => {
          const tab = client.tabs[selectedTab];
          const results = getResults(sketch, tab.sources);
          return (
            <ReportSidebar
              key={sketch.properties.id}
              selectedTab={selectedTab}
              onChangeTab={(e, tab) =>
                this.props.onChangeTab(sketch.properties.id, tab)
              }
              sketch={sketch}
              client={client}
              position={position}
              results={results}
              selectedTab={selectedTab}
              open
              menuItems={[
                {
                  label: "View logs",
                  onClick: () => {
                    window.open(
                      getResults(sketch, client.tabs[selectedTab].sources)[0].logPage,
                      "_blank"
                    );
                  }
                }
              ]}
            />
          );
        })}
      </div>
    );
  }

  onDrawModeChange = e => {
    if (e.mode === "draw_polygon" || e.mode === 'draw_point' || e.mode === 'draw_line_string') {
      this.setState({ sketch: null, exampleName: "" });
    }
  };
}

const mapStateToProps = (state, ownProps) => {
  const projectName = ownProps.match.params.project;
  const clientName = ownProps.match.params.client;
  const project = state.projects.find(p => p.name === projectName);
  var client = null;
  var clientError = null;
  const info = state.clients[projectName];
  var examples = null;
  if (info) {
    if (info.status === "failed") {
      clientError = `Failed to retrieve client ${clientName}`;
    } else if (info.status === "loaded") {
      client = info.clients.find(c => c.name === clientName);
      examples = info.examples;
      if (!client) {
        clientError = `Loaded ${projectName} but could not find client named "${clientName}"`;
      }
    }
  }
  return {
    reportSidebars: Object.keys(state.reportSidebars).map(
      k => state.reportSidebars[k]
    ),
    project,
    client,
    clientError,
    clientLoading: !client && !clientError && info,
    selectedTab: 0,
    examples,
    getResults: (sketch, sources) => getResults(sketch, sources, state.results)
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  fetchClients: (id, url) => dispatch(fetchClients(id, url)),
  onExampleChange: e => dispatch(selectExample(e)),
  closeReportSidebar: id => dispatch(closeReportSidebar(id)),
  openReportSidebar: (sketch, client, position) =>
    dispatch(openReportSidebar(sketch, client, position)),
  onChangeTab: (id, tab) => dispatch(changeReportSidebarTab(id, tab)),
  clearSidebars: () => dispatch(clearSidebars())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(withStyles(styles)(ClientDemoPage)));
