// legacy support for seasketch.org
// Includes all deps, some report client bootstrapping functions
import React from "react";
import ReactDOM from "react-dom";
import * as SeaSketchReportClient from "@seasketch-sls-geoprocessing/client";
import { ReportSidebar } from "@seasketch-sls-geoprocessing/client";
import { combineReducers, createStore, applyMiddleware } from "redux";
import { connect, Provider } from 'react-redux';
import ReduxThunk from "redux-thunk";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import JssProvider from 'react-jss/lib/JssProvider';
import { create } from 'jss';
import { createGenerateClassName, jssPreset } from '@material-ui/core/styles';
import {
  setFetchTokenFunction
} from "@seasketch-sls-geoprocessing/client";

setFetchTokenFunction(async (project) => {
  const response = await fetch(`https://www.seasketch.org/jwt/analysisToken/${window.app.state.get('project').id}/${project}`);
  const data = await response.json();
  if (data.token) {
    return data.token;
  } else {
    throw new Error("Unrecognized response from token service");
  }
}); 

const generateClassName = createGenerateClassName();
const jss = create(jssPreset());

// const esriUtils = require('@esri/arcgis-to-geojson-utils');
// const proj = require('@turf/projection');

const sketchToGeoJSON = (sketch) => {
  const properties = sketch.getAttributes().reduce((props, attr) => {
    props[attr.exportid] = attr.value;
    return props;
  }, {});

  return {
    properties: {
      id: sketch.id,
      createdAt: sketch.attributes.createdAt,
      deletedAt: sketch.attributes.deletedAt,
      updatedAt: sketch.attributes.editedAt,
      sketchClassId: sketch.attributes.sketchclass,
      parentId: sketch.attributes.parentid,
      NAME: sketch.attributes.name,
      staticGeometry: sketch.attributes.staticGeometry,
      ...properties
      // formattedAttributeNames: sketch.getAttributes().reduce((attrs, attr) => {
      //   attrs[attr.exportid] = attr.name;
      //   return attrs;
      // }, {})
    }
  }
}

const reducers = combineReducers({
  clients: SeaSketchReportClient.clientsReducer,
  results: SeaSketchReportClient.resultsReducer,
  reportSidebars: SeaSketchReportClient.reportSidebarsReducer
});

class App extends React.Component {
  state = {
    sketch: null,
    project: null,
    client: null,
    selectedTab: 0,
    clientError: null,
    open: false,
    menuItems: []
  };

  open(options) {
    const sketch = sketchToGeoJSON(options.sketch);
    this.setState({
      client: options.client,
      project: options.project,
      sketch,
      open: true,
      menuItems: options.menuItems || []
    });
    const sources = options.client.tabs[this.state.selectedTab].sources
    const results = this.props.getResults(sources, sketch);
    if (!results || !results.length || results[0].status === 'failed') {
      this.props.fetchResults(sources, sketch);
    }
  }

  render() {
    const {
      reportSidebars
    } = this.props;
    const { getResults } = this.props; 
    return (
      <div>
        {reportSidebars.map(({ selectedTab, sketch, client, position, menuItems }) => {
          const tab = client.tabs[selectedTab];
          const results = getResults(sketch, tab.sources);
          return (
            <ReportSidebar
              style={{
                position: 'absolute',
                right: 0
              }}
              tabContentContainerStyle={{
                height: "calc(100vh - 174px)"
              }}
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
              rightButtons={[
                <IconButton
                  style={{marginLeft: -4}}
                  key="close"
                  aria-owns={"menu-appbar"}
                  aria-haspopup="false"
                  onClick={() => this.props.clearSidebars()}
                  color="inherit"
                  className="nextReportsCloseButton"
                >
                  <CloseIcon />
                </IconButton>
              ]}
              closeable={true}
              menuItems={[
                ...menuItems,
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
}

const init = async clients => {
  // Setup global dependencies
  if (window.React || window.ReactDOM) {
    throw new Error("React already loaded. Already loaded reporting shim?");
  }
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.SeaSketchReportClient = {...SeaSketchReportClient};

  let reportSidebar;
  // create a store
  const store = createStore(reducers, applyMiddleware(ReduxThunk));
  window.SeaSketchReportClient.store = store;
  
  window.SeaSketchReportClient.showReport = (sketch, project, clientName, menuItems) => {
    const client = store.getState().clients[project].clients
      .find((client) => client.name === clientName);
    if (!client) {
      throw new Error(`Could not find client ${clientName} in ${project}`);
    }
    store.dispatch(SeaSketchReportClient.clearSidebars());
    store.dispatch(SeaSketchReportClient.openReportSidebar(sketchToGeoJSON(sketch), client, 0, 0, menuItems))
  }

  window.SeaSketchReportClient.hideReport = () => {
    store.dispatch(SeaSketchReportClient.clearSidebars());
  }

  // fetch clients
  for (var path of clients) {
    let [url, clientName] = path.split("#");
    let projectName = url.split("/").slice(-2)[0];
    store.dispatch(SeaSketchReportClient.fetchClients(projectName, url));
  }
  const newDiv = document.createElement("div");
  newDiv.id = "nextReportsContainer";
  document.body.appendChild(newDiv);
  const mapStateToProps = (state) => {
    return {
      reportSidebars: Object.keys(state.reportSidebars).map(
        k => state.reportSidebars[k]
      ),  
      getResults: (sketch, sources) => SeaSketchReportClient.getResults(sketch, sources, state.results)
    }
  }
  const mapDispatchToProps = (dispatch) => {
    return {
      fetchResults: (sources, sketch) => {
        dispatch(SeaSketchReportClient.fetchResults(sources, sketch))
      },
      clearSidebars: () => dispatch(SeaSketchReportClient.clearSidebars()),
      onChangeTab: (id, tab) => dispatch(SeaSketchReportClient.changeReportSidebarTab(id, tab))
    }
  }
  const Container = connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(App);
  ReactDOM.render(
    <Provider store={store}>
      <JssProvider jss={jss} generateClassName={generateClassName}>
        <Container ref={(element) => reportSidebar = element.getWrappedInstance()} />
      </JssProvider>
    </Provider>,
    newDiv
  )
  window.reportSidebar = reportSidebar;
};

export { init };
