import { invocationFromJSON } from "@seasketch-sls-geoprocessing/client";
import { API_HOST, openEventSource } from "@seasketch-sls-geoprocessing/client";

export const UPDATE_INVOCATIONS = 'UPDATE_INVOCATIONS';
export const UPDATE_INVOCATION = 'UPDATE_INVOCATION';

var lastETag = null;

export const fetchInvocations = async (dispatch) => {
  const response = await fetch("/api/recent-invocations");
  if (response.headers.get('etag') !== lastETag) {
    const invocations = await response.json();
    dispatch({
      type: UPDATE_INVOCATIONS,
      invocations: invocations.map(invocationFromJSON)
    });
    lastETag = response.headers.get('etag');
  } else {
    // do nothing
  }
}

export const fetchInvocation = (id) => {
  return async (dispatch) => {
    let url = `${API_HOST}/api/invocations/${id}`;
    const response = await fetch(url);
    const data = await response.json();
    dispatch({
      type: UPDATE_INVOCATION,
      status: invocationFromJSON(data)
    });
    if (!data.closed) {
      openEventSource(data.uuid, data.source, dispatch, data.events);
    }
  }
}
