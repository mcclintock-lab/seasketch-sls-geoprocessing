import { UPDATE_INVOCATIONS, UPDATE_INVOCATION } from '../actions/invocations';
import { REPORTING_LOG_EVENT, REPORTING_STATUS_UPDATE } from '@seasketch-sls-geoprocessing/client';

const reducer = (state = {}, action) => {
  switch (action.type) {
    case UPDATE_INVOCATIONS:
      return {
        ...state,
        ...action.invocations.filter((i) => !state[i.uuid] || !state[i.uuid].logs).reduce((obj, i) => {
          obj[i.uuid] = i;
          return obj;
        }, {})
      }
    case UPDATE_INVOCATION:
      return {
        ...state,
        [action.status.uuid]: action.status
      }
    case REPORTING_STATUS_UPDATE:
      const status = {
        ...action.status
      };
      if (!status.logs && state[status.uuid] && state[status.uuid].logs) {
        status.logs = state[status.uuid].logs;
      }
      return {
        ...state,
        [status.uuid]: status
      }
    case REPORTING_LOG_EVENT:
      const requestId = action.payload.requestId;
      var invocation = null;
      for (var key in state) {
        if (state[key].uuid === requestId || state[key].requestId === requestId) {
          invocation = state[key];
        }
      }
      if (!invocation) {
        throw new Error(`Could not find related invocation for log entry with requestId ${requestId}`);
      }
    // avoid inserting duplicates
      if (!invocation.logs.find((l) => l.id === action.payload.id)) {
        invocation = {
          ...invocation
        };
        invocation.logs = [
          ...invocation.logs,
          action.payload
        ];
        if (invocation.logs.length > 1 && new Date(invocation.logs[invocation.logs.length - 1].timestamp) < new Date(invocation.logs[invocation.logs.length - 2].timestamp)) {
          invocation.logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        return {
          ...state,
          [invocation.uuid]: invocation
        }
      } else {
        return state;
      }
    default:
      return state
  }
}

export default reducer