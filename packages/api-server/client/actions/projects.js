import debounce from 'debounce';

export const UPDATE_PROJECTS = "UPDATE_PROJECTS";

export const updateProjects = projects => ({
  type: UPDATE_PROJECTS,
  projects
});

var lastETag = null;

export const fetchProjects = async dispatch => {
  const response = await fetch("/api/projects", {
    headers: new Headers({
      "Content-Type": "application/json",
      ...( localStorage.token ? {Authorization: `Bearer ${localStorage.token}`} : {})
    })
  });
  if (response.headers.get("etag") !== lastETag) {
    const projects = await response.json();
    dispatch(updateProjects(projects));
    lastETag = response.headers.get("etag");
  } else {
    // do nothing
  }
};

export const TOGGLE_REQUIRE_AUTH = "TOGGLE_REQUIRES_AUTHORIZATION";
export const toggleRequireAuth = id => {
  return (dispatch, getState) => {
    const project = getState().projects.find(p => p.name === id);
    fetch("/api/project", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.token}`
      }),
      body: JSON.stringify({
        ...project,
        requireAuth: !project.requireAuth
      })
    });
    dispatch({
      type: TOGGLE_REQUIRE_AUTH,
      id
    });
  };
};

export const UPDATE_AUTHORIZED_CLIENTS = "UPDATE_AUTHORIZED_CLIENTS";

export const updateAuthorizedClients = (id, clients) => {
  return (dispatch, getState) => {
    const project = getState().projects.find(p => p.name === id);
    fetch("/api/project", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.token}`
      }),
      body: JSON.stringify({
        ...project,
        authorizedClients: clients
      })
    });
    dispatch({
      type: UPDATE_AUTHORIZED_CLIENTS,
      id,
      clients
    });
  };
};

export const UPDATE_COST_LIMIT = "UPDATE_COST_LIMIT";

export const updateCostLimit = (projectName, func, value) => {
  return (dispatch, getState) => {
    dispatch({
      type: UPDATE_COST_LIMIT,
      function: func,
      project: projectName,
      value: parseInt(value)  
    });
    const project = getState().projects.find(p => p.name === projectName);
    saveCostLimit(project, func, value);
  }
};

const saveCostLimit = debounce((project, func, value) => {
  fetch("/api/costLimit", {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.token}`
    }),
    body: JSON.stringify({
      functionName: project.functions.find((f) => f.name === func).functionName,
      costLimitUsd: parseInt(value)
    })
  });
});