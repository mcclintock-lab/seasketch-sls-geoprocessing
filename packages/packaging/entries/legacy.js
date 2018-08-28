// legacy support for seasketch.org
// Includes all deps, some report client bootstrapping functions
import React from "react";
import ReactDOM from "react-dom";
import * as client from "@seasketch-sls-geoprocessing/client";

const init = () => {
  if (window.React || window.ReactDOM) {
    throw new Error("React already loaded. Already loaded reporting shim?");
  }
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.SeaSketchReportClient = client;
};

export { init };
