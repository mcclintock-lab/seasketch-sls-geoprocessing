import React from "react";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core";
import { withRouter } from "react-router";
import Map from "./MapInput";
import { connect } from "react-redux";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
  fetchResults,
  fetchClients,
  ReportClientLoader,
  ExampleSelect,
  ReportSidebar
} from "@seasketch-sls-geoprocessing/client";
import uuid from 'uuid/v4';

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

  componentDidUpdate(prevProps) {
    if (
      !this.props.client &&
      !this.props.clientLoading &&
      !this.props.clientError
    ) {
      this.fetchClient();
    }
    if (!prevProps.examples && !!this.props.examples && this.props.examples.length) {
      const example = this.props.examples[0];
      this.setState({
        exampleName: example.name,
        sketch: example.feature
      });
      this.props.fetchResults(this.props.client.tabs[this.props.selectedTab].sources, example.feature);
    }
  }

  onInput = (feature) => {
    feature.properties = {
      name: "DrawnFeature",
      id: uuid()
    }
    this.setState({
      sketch: feature
    });
    this.props.fetchResults(this.props.client.tabs[this.props.selectedTab].sources, feature);
  }

  fetchResults(sketch, sources) {
    this.props.fetchResults(
      this.props.example.feature,
      this.props.client.tabs[this.props.selectedTab].sources
    );
  }

  onExampleChange = (e) => {
    const example = this.props.examples.find((ex) => ex.name === e.target.value);
    this.setState({
      sketch: example.feature,
      exampleName: e.target.value
    });
    this.props.fetchResults(this.props.client.tabs[this.props.selectedTab].sources, example.feature);
  }

  render() {
    const {
      project,
      client,
      selectedTab,
      classes,
      clientError,
      examples,
      getResults
    } = this.props;
    if (!project) {
      return <CircularProgress className={classes.progress} />;
    }
    var example = null;
    if (this.state.exampleName) {
      example = examples.find((e) => e.name === this.state.exampleName).feature;
    }
    return (
      <div className={classes.root}>
        <ExampleSelect style={{left: 60}} examples={examples || []} example={this.state.exampleName} onChange={this.onExampleChange} allowBlank noLabel />
        <Map example={example} initialCenter={project.center} initialZoom={project.zoom} onDrawModeChange={this.onDrawModeChange} onInput={this.onInput} />
        <ReportSidebar
          client={client}
          sketch={this.state.sketch}
          results={this.state.sketch ? getResults(client.tabs[selectedTab].sources, this.state.sketch) : null}
          selectedTab={selectedTab}
          clientError={clientError}
          open
          closeable={false}
          menuItems={[
            {
              label: 'View logs',
              onClick: () => { window.open(getResults(client.tabs[selectedTab].sources, this.state.sketch)[0].logPage, "_blank")}
            },
            {
              label: 'Download GeoJSON',
              onClick: () => { window.open(getResults(client.tabs[selectedTab].sources, this.state.sketch)[0].payload, "_blank")}
            }
          ]}
        />
      </div>
    );
  }

  onDrawModeChange = (e) => {
    if (e.mode === 'draw_polygon') {
      this.setState({sketch: null, exampleName: ""});
    }
  }
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
    project,
    client,
    clientError,
    clientLoading: !client && !clientError && info,
    selectedTab: 0,
    examples,
    getResults: (sources, sketch) => {
      const out = [];
      for (let source of sources) {
        let r = state.results[[source, sketch.properties.id].join("-")];
        if (r) {
          out.push(r)
        }
      }
      return out;
    }
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onExampleChange: e => dispatch(selectExample(e)),
  fetchResults: (sketch, sources) => dispatch(fetchResults(sketch, sources)),
  fetchClients: (id, url) => dispatch(fetchClients(id, url))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(withStyles(styles)(ClientDemoPage)));
