import { UPDATE_PROJECTS, TOGGLE_REQUIRE_AUTH, UPDATE_AUTHORIZED_CLIENTS, UPDATE_COST_LIMIT } from '../actions/projects';

const initialState = [];

const reducer = (state = [], action) => {
  switch (action.type) {
    case UPDATE_PROJECTS:
      return action.projects.map((p) => ({
        ...p,
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : null
      }))
    case TOGGLE_REQUIRE_AUTH:
      return state.map((p) => {
        if (p.name === action.id) {
          return {
            ...p,
            requireAuth: !p.requireAuth
          }
        } else {
          return p
        }
      });
    case UPDATE_AUTHORIZED_CLIENTS:
      return state.map((p) => {
        if (p.name === action.id) {
          return {
            ...p,
            authorizedClients: action.clients
          }
        } else {
          return p
        }
      });
    case UPDATE_COST_LIMIT:
      return state.map((p) => {
        if (p.name === action.project) {
          return {
            ...p,
            functions: p.functions.map((f) => {
              if (f.name === action.function) {
                return {
                  ...f,
                  costLimitUsd: action.value
                }
              } else {
                return f;
              }
            })
          }
        } else {
          return p;
        }
      });
    default:
      return state
  }
}

export default reducer