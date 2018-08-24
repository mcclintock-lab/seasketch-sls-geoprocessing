import React from "react";
import slug from "slugify";
import Card from "./components/Card";
import JSONCard from "./components/JSONCard";
import ReportTabs from "./components/ReportTabs";
import ReportSidebar from "./components/ReportSidebar";
import ReportClientLoader from "./loader";
import ExampleSelect from "./components/ExampleSelect";
import FileDownloadCard from "./components/FileDownloadCard";
import HumanizedDuration from "./components/HumanizedDuration";

import clientsReducer from "./redux/reducers/clients";
import resultsReducer from "./redux/reducers/results";
import {fromJSON as invocationFromJSON} from "./redux/utils";
import {
  fetchClients,
  fetchResults,
  API_HOST,
  REPORTING_EVENT_TYPE_LOG_EVENT,
  REPORTING_EVENT_TYPE_STATUS_UPDATE,
  REPORTING_LOG_EVENT,
  REPORTING_STATUS_UPDATE,
  openEventSource,
} from "./redux/actions";

const requiredProps = ["sources", "title"];

const asReportTab = metadata => {
  return Component => {
    for (var prop of requiredProps) {
      if (!(prop in metadata)) {
        throw new Error(`Missing required prop "${prop}"`);
      }
    }
    const renderer = props => <Component {...props} />;
    Object.keys(metadata).forEach(k => (renderer[k] = metadata[k]));
    return renderer;
  };
};

const slugify = function() {
  const args = Array.from(arguments);
  if (/\./.test(args[args.length - 1])) {
    const ext = args.pop();
    return slug(args.join(" ")) + ext;
  } else {
    return slug(args.join(" "));
  }
};

export {
  // client higher-order component
  asReportTab,
  // components
  Card,
  JSONCard,
  ReportTabs,
  ReportSidebar,
  ReportClientLoader,
  ExampleSelect,
  FileDownloadCard,
  HumanizedDuration,
  // # Redux
  // reducers
  clientsReducer,
  resultsReducer,
  invocationFromJSON,
  // actions
  fetchClients,
  fetchResults,
  API_HOST,
  REPORTING_EVENT_TYPE_LOG_EVENT,
  REPORTING_EVENT_TYPE_STATUS_UPDATE,
  REPORTING_LOG_EVENT,
  REPORTING_STATUS_UPDATE,
  openEventSource,
  // utils
  slugify
};
