export const UPDATE_PROJECTS = 'UPDATE_PROJECTS';

export const updateProjects = (projects) => ({
  type: UPDATE_PROJECTS,
  projects
});

var lastETag = null;

export const fetchProjects = async (dispatch) => {
  const response = await fetch("/api/projects");
  if (response.headers.get('etag') !== lastETag) {
    const projects = await response.json();
    dispatch(updateProjects(projects))
    lastETag = response.headers.get('etag');
  } else {
    // do nothing
  }
}