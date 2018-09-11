import projects from "./projects";
import invocations from './invocations';
import { clientsReducer, resultsReducer, reportSidebarsReducer } from "@seasketch-sls-geoprocessing/client";
import { combineReducers } from "redux";

export default combineReducers({
  projects,
  clients: clientsReducer,
  results: resultsReducer,
  invocations,
  reportSidebars: reportSidebarsReducer
});
