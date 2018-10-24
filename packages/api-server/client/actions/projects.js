export const UPDATE_PROJECTS = 'UPDATE_PROJECTS';

export const updateProjects = (projects) => ({
  type: UPDATE_PROJECTS,
  projects
});

var lastETag = null;

export const fetchProjects = async (dispatch) => {
  const response = await fetch("/api/projects", {
    headers: new Headers({
      'Authorization': `Bearer ${localStorage.token}`
    })
  });
  if (response.headers.get('etag') !== lastETag) {
    const projects = await response.json();
    dispatch(updateProjects(projects))
    lastETag = response.headers.get('etag');
  } else {
    // do nothing
  }
}

export const TOGGLE_REQUIRE_AUTH = "TOGGLE_REQUIRES_AUTHORIZATION";
export const toggleRequireAuth = (id) => {
  return (dispatch, getState) => {
    const project = getState().projects.find((p) => p.name === id);
    fetch("/api/project", {
      method: "POST",
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.token}`
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
  }
};

export const UPDATE_AUTHORIZED_CLIENTS = "UPDATE_AUTHORIZED_CLIENTS";

export const updateAuthorizedClients = (id, clients) => {
  return (dispatch, getState) => {
    const project = getState().projects.find((p) => p.name === id);
    fetch("/api/project", {
      method: "POST",
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.token}`
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
  }
};