import slug from "slugify";
import Card from "./src/components/Card";
import JSONCard from "./src/components/JSONCard";
import ReportTabs from "./src/components/ReportTabs";
import ReportSidebar from "./src/components/ReportSidebar";
import ReportClientLoader from "./src/loader";
import ExampleSelect from "./studio/components/ExampleSelect";
import FileDownloadCard from "./src/components/FileDownloadCard";
import HumanizedDuration from "./src/components/HumanizedDuration";

import clientsReducer from "./src/redux/reducers/clients";
import resultsReducer from "./src/redux/reducers/results";
import {fromJSON as invocationFromJSON} from "./src/redux/utils";
import {
  fetchClients,
  fetchResults,
  API_HOST,
  REPORTING_EVENT_TYPE_LOG_EVENT,
  REPORTING_EVENT_TYPE_STATUS_UPDATE,
  REPORTING_LOG_EVENT,
  REPORTING_STATUS_UPDATE,
  openEventSource,
} from "./src/redux/actions";

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
