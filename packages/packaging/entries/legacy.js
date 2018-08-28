// legacy support for seasketch.org
// Includes all deps, some report client bootstrapping functions
import React from "react";
import ReactDOM from "react-dom";
import * as client from "@seasketch-sls-geoprocessing/client"; 
import {combineReducers, createStore, applyMiddleware} from 'redux';
import ReduxThunk from 'redux-thunk'

const reducers = combineReducers({clients: client.clientsReducer, results: client.resultsReducer});

const init = async (clients) => {
  console.log('clients', clients);
  // Setup global dependencies
  if (window.React || window.ReactDOM) {
    throw new Error("React already loaded. Already loaded reporting shim?");
  }
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.SeaSketchReportClient = client;
  // create a store
  const store = createStore(
    reducers,
    applyMiddleware(ReduxThunk)
  );
  SeaSketchReportClient.store = store;
  for (var path of clients) {
    let [url, clientName] = path.split("#");
    let projectName = url.split("/").slice(-2)[0];
    store.dispatch(client.fetchClients(projectName, url));
  }
};

export { init };
