import {
  TOGGLE_SIDEBAR_POSITION,
  CLOSE_REPORT_SIDEBAR,
  OPEN_REPORT_SIDEBAR,
  CHANGE_REPORT_SIDEBAR_TAB
} from "../actions";

const reducer = (state = {}, action) => {
  const id = action.id;
  switch (action.type) {
    case TOGGLE_SIDEBAR_POSITION:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          position: +!state[action.id].position
        }
      }
    case CLOSE_REPORT_SIDEBAR:
      const newState = { ...state };
      delete newState[action.id];
      return newState;
    case OPEN_REPORT_SIDEBAR:
      return {
        ...state,
        [action.sketch.properties.id]: {
          sketch: action.sketch,
          id: action.sketch.properties.id,
          client: action.client,
          position: Object.keys(state).length,
          selectedTab: 0
        }
      }
    case CHANGE_REPORT_SIDEBAR_TAB:
      return {
        ...state,
        [action.id]: {
          ...state[action.id],
          selectedTab: action.tab
        }
      }
    default:
      return state;
  }
};

export default reducer;
