const tokens = {};
const failedProjectTokenRequests = {};

export const tokenCache = {
  get: (project) => tokens[project],
  set: (project, token) => tokens[project] = token
};

let fetchForProject = async (project) => {
  let token = tokenCache.get(project);
  if (token) {
    return token;
  } else {
    throw new Error("No token in cache");
  }
}

export const fetchTokenForProject = async (project) => {
  if (failedProjectTokenRequests[project]) {
    throw new Error("Failed to request token");
  } else {
    try {
      const token = await fetchForProject(project);
      tokenCache.set(project, token);
      return tokenCache.get(project);
    } catch(e) {
      failedProjectTokenRequests[project] = true;
    }
  }
}

export const setFetchTokenFunction = (func) => {
  fetchForProject = func;
}