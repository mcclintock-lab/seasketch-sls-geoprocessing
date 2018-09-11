import map from "./map";
import examples from "./examples";
import results from "./results";
import { combineReducers } from 'redux';
import { reportSidebarsReducer as reportSidebars } from '@seasketch-sls-geoprocessing/client';

export default combineReducers({map, examples, results, reportSidebars});