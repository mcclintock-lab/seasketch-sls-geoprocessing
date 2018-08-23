import { REPORTING_FETCH_CLIENT, REPORTING_CLIENT_ERROR, REPORTING_CLIENT_LOADED } from '../actions';

const reducer = (state = {}, action) => {
  const id = action.id
  switch (action.type) {
    case REPORTING_FETCH_CLIENT:
      return {
        ...state,
        [id]: {
          status: 'requesting'
        }
      }
      break;
    case REPORTING_CLIENT_ERROR:
      return {
        ...state,
        [id]: {
          ...state[id],
          status: 'failed',
          error: action.error
        }
      }
      break;
    case REPORTING_CLIENT_LOADED:
      return {
        ...state,
        [id]: {
          status: 'loaded',
          clients: action.clients,
          examples: action.examples || []
        }
      }
    default:
      return state
  }
}

export default reducer