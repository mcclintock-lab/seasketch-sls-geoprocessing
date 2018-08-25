import loader from '../loader';
import uuid from 'uuid/v4';

export const API_HOST = process.env.NODE_ENV === 'production' ?
  "https://analysis.seasketch.org" : "";//`${window.location.protocol}//${window.location.host}`;
export const REPORTING_FETCH_CLIENT = 'REPORTING_FETCH_CLIENT';
export const REPORTING_CLIENT_LOADED = 'REPORTING_CLIENT_LOADED';
export const REPORTING_CLIENT_ERROR = 'REPORTING_CLIENT_ERROR';
import {fromJSON} from './utils';

export const fetchClients = (id, url) => {
  return async (dispatch) => {
    dispatch({
      type: REPORTING_FETCH_CLIENT,
      id: id,
      url: url
    });
    var error;
    try {
      const { clients, examples } = await loader(id, url);
      dispatch({
        type: REPORTING_CLIENT_LOADED,
        id: id,
        clients: clients,
        examples: examples
      })
    } catch (e) {
      dispatch({
        type: REPORTING_CLIENT_ERROR,
        id: id,
        error
      })
    }
  }
}

export const REPORTING_FETCH_RESULTS = 'REPORTING_FETCH_RESULTS';

export const fetchResults = (sources, sketch) => {
  return (dispatch) => {
    dispatch({
      type: REPORTING_FETCH_RESULTS,
      sources: sources,
      sketch: sketch
    });
    for (const source of sources) {
      fetchSource(source, sketch, dispatch);
    }
  }
}

export const REPORTING_RESULTS_REQUESTED = 'REPORTING_RESULTS_REQUESTED';
export const REPORTING_STATUS_UPDATE = 'REPORTING_RESULTS_STATUS_UPDATE';
export const REPORTING_LOG_EVENT = 'REPORTING_LOG_EVENT';
export const REPORTING_REQUEST_ERROR = 'REPORTING_RESULTS_REQUEST_ERROR';
export const REPORTING_EVENT_TYPE_STATUS_UPDATE = 'REPORTING_EVENT_TYPE_STATUS_UPDATE';
export const REPORTING_EVENT_TYPE_LOG_EVENT = 'REPORTING_EVENT_TYPE_LOG_EVENT';

const fetchSource = async (source, sketch, dispatch) => {
  const [ project, stage, func] = source.split("-");
  const id = sketch.properties.id || uuid();
  dispatch({
    type: REPORTING_RESULTS_REQUESTED,
    id,
    source
  });
  try {
    let url = `${API_HOST}/api/${project}/functions/${func}`;
    const isPOST = sketch.properties && sketch.properties.sketchClass;
    if (isPOST) {
      url += `?id=${sketch.properties.id}`
    }
    const opts = {
      method: isPOST ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: isPOST ? null : JSON.stringify(sketch)
    }
    const response = await fetch(url, opts);
    const data = await response.json();
    dispatch({
      type: REPORTING_STATUS_UPDATE,
      source,
      id,
      status: fromJSON(data)
    });
    if(!data.closed) {
      openEventSource(id, source, dispatch, data.events);
    }
  } catch (e) {
    dispatch({
      type: REPORTING_REQUEST_ERROR,
      error: e,
      source,
      id
    });
  }
}

const eventSources = {};

// Opens an SSE channel to listen for updates to an reporting invocation. 
// Will dispatch actions:
//   RESULTS_STATUS_UPDATE
//   RESULTS_LOGS
export const openEventSource = (id, source, dispatch, url) => {
  const key = [source, id].join("-");
  if (eventSources[key]) {
    eventSources[key].close();
  }
  eventSources[key] = new EventSource(url);
  eventSources[key].onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (!data.eventType) {
      // old style message
      dispatch({
        type: REPORTING_STATUS_UPDATE,
        source,
        id,
        status: fromJSON(data)
      });
      if (data.closed) {
        eventSources[key].close();
        eventSources[key] = null;
      }
    } else if (data.eventType === REPORTING_EVENT_TYPE_STATUS_UPDATE) {
      dispatch({
        type: REPORTING_STATUS_UPDATE,
        source,
        id,
        status: fromJSON(data.payload)
      });
      if (data.payload.closed) {
        eventSources[key].close();
        eventSources[key] = null;
      }  
    } else if (data.eventType === REPORTING_EVENT_TYPE_LOG_EVENT) {
      dispatch({
        type: REPORTING_LOG_EVENT,
        source,
        id,
        payload: data.payload
      });
    } else {
      throw new Error(`Unknown reporting event type ${data.eventType}`);
    }
  }
}
