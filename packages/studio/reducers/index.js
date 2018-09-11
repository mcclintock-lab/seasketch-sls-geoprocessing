import map from "./map";
import examples from "./examples";
import { combineReducers } from 'redux';
import { reportSidebarsReducer as reportSidebars } from '@seasketch-sls-geoprocessing/client';
import { resultsReducer as results } from '@seasketch-sls-geoprocessing/client';

export default combineReducers({map, examples, results, reportSidebars});