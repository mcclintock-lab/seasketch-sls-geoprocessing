const projects = {};

const load = (projectName, url) => {
  if (projects[projectName]) {
    return projects[projectName];
  } else {
    const script = document.createElement('script');
    script.async = true;
    projects[projectName] = new Promise(function (resolve, reject) {
      script.addEventListener('load', () => {
        projects[projectName] = {
          name: projectName,
          ...window[projectName]
        };
        resolve(projects[projectName]);
      });
      script.addEventListener('error', () => {
        reject(new Error(`Failed to load ${projectName} at ${url}`))
      });
      script.src = url;
      document.body.appendChild(script);
    });
    return projects[projectName];
  }
}

export default load;