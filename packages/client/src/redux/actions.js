import loader from "../loader";
import uuid from "uuid/v4";

const API_HOST = process.env.API_HOST || "https://analysis.seasketch.org";
export { API_HOST };
export const REPORTING_FETCH_CLIENT = "REPORTING_FETCH_CLIENT";
export const REPORTING_CLIENT_LOADED = "REPORTING_CLIENT_LOADED";
export const REPORTING_CLIENT_ERROR = "REPORTING_CLIENT_ERROR";
import { fromJSON } from "./utils";
import { fetchTokenForProject, tokenCache } from './auth';

export const fetchClients = (id, url) => {
  return async dispatch => {
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
      });
    } catch (e) {
      dispatch({
        type: REPORTING_CLIENT_ERROR,
        id: id,
        error
      });
      throw new Error(
        `Failed to load report client code ${id} at ${url}. It could be published using an incompatible version of seasketch-sls-geoprocessing.`
      );
    }
  };
};

export const REPORTING_FETCH_RESULTS = "REPORTING_FETCH_RESULTS";

export const fetchResults = (sources, sketch) => {
  return dispatch => {
    dispatch({
      type: REPORTING_FETCH_RESULTS,
      sources: sources,
      sketch: sketch
    });
    for (const source of sources) {
      fetchSource(source, sketch, dispatch);
    }
  };
};

export const REPORTING_RESULTS_REQUESTED = "REPORTING_RESULTS_REQUESTED";
export const REPORTING_STATUS_UPDATE = "REPORTING_RESULTS_STATUS_UPDATE";
export const REPORTING_LOG_EVENT = "REPORTING_LOG_EVENT";
export const REPORTING_REQUEST_ERROR = "REPORTING_RESULTS_REQUEST_ERROR";
export const REPORTING_EVENT_TYPE_STATUS_UPDATE =
  "REPORTING_EVENT_TYPE_STATUS_UPDATE";
export const REPORTING_EVENT_TYPE_LOG_EVENT = "REPORTING_EVENT_TYPE_LOG_EVENT";

const fetchSource = async (source, sketch, dispatch) => {
  const [project, stage, func] = source.split("-");
  const id = sketch.properties.id || uuid();
  dispatch({
    type: REPORTING_RESULTS_REQUESTED,
    id,
    source
  });
  try {
    let url = `${API_HOST}/api/${project}/functions/${func}`;
    if (/localhost:3009/.test(API_HOST)) {
      url = `${API_HOST}/tasks/${func}`;
    }
    const isPOST = sketch.properties && sketch.properties.sketchClassId;
    if (isPOST) {
      url += `?id=${sketch.properties.id}`;
    }
    const opts = {
      method: isPOST ? "GET" : "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        ...( tokenCache.get(project) ? {"Authorization": `Bearer ${tokenCache.get(project)}`} : {} )
      }),
      body: isPOST ? null : JSON.stringify(sketch)
    };
    const response = await fetch(url, opts);
    if (response.ok) {
      const data = await response.json();
      if (/offline/.test(data.requestId)) {
        data.status = "complete";
        data.project = project;
        data.function = func;
      } else if(!data.closed) {
        openEventSource(id, source, dispatch, data.events);
      }
      dispatch({
        type: REPORTING_STATUS_UPDATE,
        source,
        id,
        status: fromJSON(data)
      });
    } else {
      var data = {};
      try {
        data = await response.json();
      } catch(e) {
        // do nothing
      }
      if (response.status === 403 && 
        // don't retry if already tried with a token
        !opts.headers.get('Authorization')) {
        try {
          const token = await fetchTokenForProject(project);
          fetchSource(source, sketch, dispatch);
        } catch(e) {
          dispatch({
            type: REPORTING_STATUS_UPDATE,
            source,
            id,
            status: {
              status: "failed",
              error: data.message || `Token problem requesting report ${source}, ${id}. ${response.status}`
            }
          });
          setTimeout(() => {
            throw new Error(
              `Token problem requesting report ${source}, ${id}. ${response.status}`
            );
          }, 100);  
        }
      } else {
        dispatch({
          type: REPORTING_STATUS_UPDATE,
          source,
          id,
          status: {
            status: "failed",
            error: data.message || `Problem requesting report ${source}, ${id}. ${response.status}`
          }
        });
        setTimeout(() => {
          throw new Error(
            `Problem requesting report ${source}, ${id}. ${response.status}`
          );
        }, 1000);  
      }
    }
  } catch (e) {
    dispatch({
      type: REPORTING_STATUS_UPDATE,
      source,
      id,
      status: "failed",
      error: e.toString()
    });
  }
};

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
  eventSources[key].onmessage = e => {
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
  };
};

// Report Sidebars

export const TOGGLE_SIDEBAR_POSITION = "TOGGLE_SIDEBAR_POSITION";
export const CLOSE_REPORT_SIDEBAR = "CLOSE_REPORT_SIDEBAR";
export const OPEN_REPORT_SIDEBAR = "OPEN_REPORT_SIDEBAR";
export const CHANGE_REPORT_SIDEBAR_TAB = "CHANGE_REPORT_SIDEBAR_TAB";
export const CLEAR_SIDEBARS = "CLEAR_REPORT_SIDEBARS";

export const toggleSidebarPosition = (id) => ({
  type: TOGGLE_SIDEBAR_POSITION,
  id
});

export const closeReportSidebar = (id) => {
  return {
    type: CLOSE_REPORT_SIDEBAR,
    id
  }
}

export const openReportSidebar = (sketch, client, position, tab=0, menuItems=[]) => {
  return (dispatch, getState) => {
    dispatch({
      type: OPEN_REPORT_SIDEBAR,
      client,
      sketch,
      position,
      tab,
      menuItems
    });
    const sources = client.tabs[tab].sources;
    fetchRequiredSources(sources, sketch, getState(), dispatch);
  }
};

export const changeReportSidebarTab = (id, tab) => {
  return (dispatch, getState) => {
    dispatch({
      type: CHANGE_REPORT_SIDEBAR_TAB,
      id,
      tab
    });
    const sidebar = getState().reportSidebars[id]
    const sources = sidebar.client.tabs[tab].sources;
    fetchRequiredSources(sources, sidebar.sketch, getState(), dispatch);
  }
};


const fetchRequiredSources = (sources, sketch, state, dispatch) => {
  const results = state.results;
  for (let source of sources) {
    let r = results[[source, sketch.properties.id].join("-")];
    if (!r || r.status === 'failed') {
      fetchSource(source, sketch, dispatch);
    }
  }
}

export const TOGGLE_EMAIL_SUBSCRIPTION = 'TOGGLE_EMAIL_SUBSCRIPTION';
export const toggleEmailMe = async (toggle, title, url, uuid, project) => {
  let token = tokenCache.get(project);
  if (!token) {
    token = await fetchTokenForProject(project);
    if (!token) {
      throw new Error(`Could not fetch token for project ${project}`)
    }
  }
  fetch(`${API_HOST}/api/email-me`, {
    method: "POST",
    headers: new Headers({
      'content-type': 'application/json',
      "authorization": `Bearer ${token}`
    }),
    body: JSON.stringify({
      reportName: title,
      invocationId: uuid,
      url,
      toggle
    })
  });
  return {
    type: TOGGLE_EMAIL_SUBSCRIPTION,
    toggle,
    title,
    url,
    uuid,
    project
  }
}

export const clearSidebars = () => ({
  type: CLEAR_SIDEBARS
});