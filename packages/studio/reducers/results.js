import { UPDATE_RESULTS } from '../actions/results';

export const getResults = (sketch, sources, items) => {
  const results = [];
  for (let source of sources) {
    const project = source.split("-")[0];
    const func = source.split("-").pop();
    const result = items.find((result) => (
      result.sketchId === sketch.properties.id && 
      result.project === project && 
      result.function === func
    ));
    if (result) {
      results.push(result);
    }
  }
  return results.length ? results : null;
}

const reducer = (state = [], action) => {
  switch (action.type) {
    case UPDATE_RESULTS:
      const func = action.results.function
      const existing = state.find((results) => {
        return results.sketchId === action.results.sketchId && 
        results.function === action.results.function && 
        results.project === action.results.project
      });
      const i = state.indexOf(existing);
      if (existing) { 
        return [
          ...state.slice(0, i),
          action.results,
          ...state.slice(i + 1)
        ]
      } else {
        return [
          action.results,
          ...state
        ]
      }
    default:
      return state
  }
}

export default reducer