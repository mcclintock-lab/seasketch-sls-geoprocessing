import examples from '../examples';
import { SELECT_EXAMPLE } from '../actions/examples';

const initialState = {
  items: examples,
  selected: examples[0].name
}

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SELECT_EXAMPLE:
      return {
        ...state,
        selected: action.example.name
      }
      break;
    default:
      return state
  }
}

export default reducer