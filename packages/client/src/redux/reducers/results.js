import {
  REPORTING_REQUEST_ERROR,
  REPORTING_RESULTS_REQUESTED,
  REPORTING_STATUS_UPDATE,
  REPORTING_LOG_EVENT,
} from "../actions";
import {fromJSON} from '../utils';

const reducer = (state = {}, action) => {
  const key = [action.source, action.id].join("-");
  switch (action.type) {
    case REPORTING_RESULTS_REQUESTED:
      return {
        ...state,
        [key]: {
          status: "requesting"
        }
      };
    case REPORTING_REQUEST_ERROR:
      return {
        ...state,
        [key]: {
          error: action.error,
          requestError: true
        }
      };
    case REPORTING_STATUS_UPDATE:
      console.log(action, fromJSON(action.status), state[key]);
      return {
        ...state,
        [key]: fromJSON(action.status)
      };
    default:
      return state;
  }
};

export default reducer;
