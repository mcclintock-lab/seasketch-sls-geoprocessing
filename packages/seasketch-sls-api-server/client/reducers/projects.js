import { UPDATE_PROJECTS } from '../actions/projects';

const initialState = [];

const reducer = (state = [], action) => {
  switch (action.type) {
    case UPDATE_PROJECTS:
      return action.projects.map((p) => ({
        ...p,
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : null
      }))
      break;
    default:
      return state
  }
}

export default reducer