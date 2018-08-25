const endpoint = (source) => `/tasks/${source.split("-").pop()}`

export const UPDATE_RESULTS = 'UPDATE_RESULTS';

const createStatus = (sketch, source) => {
  return {
    location: 'https://analysis.seasketch.org/' + sketch.properties.id,
    events: 'https://analysis.seasketch.org/' + sketch.properties.id + "/events",
    payload: 'https://analysis.seasketch.org/' + sketch.properties.id + "/payload",
    requestedAt: new Date(),
    project: source.split('-')[0],
    function: source.split('-').pop(),
    eta: 2,
    payloadSizeBytes: 1234,
    results: null,
    sketchId: sketch.properties.id,
    status: 'requested',
    logs: []
  }
};

const updateResults = (result) => ({
  type: UPDATE_RESULTS,
  results: result
})

export const fetchResults = (sketch, sources) => {
  const results = sources.map((source) => createStatus(sketch, source));
  return async (dispatch) => {
    for (var result of results) {
      dispatch(updateResults(result));
      try {
        const response = await fetch(endpoint(result.function), {
          method: "POST",
          body: JSON.stringify(sketch),
          headers: {
            "Content-Type": "application/json"
          }
        })
        const data = await response.json();
        dispatch(updateResults({
          ...result, 
          ...data,
          status: 'complete'
        }));  
      } catch(e) {
        dispatch(updateResults({
          ...result, 
          status: 'failed',
          logs: [{
            timestamp: new Date().getTime(),
            type: 'stderr',
            message: 'Failed. See terminal for sls offline logs'
          }]
        }));          
      }
    }
  }
}