import { MapActionTypes } from '@mapbox/mapbox-gl-redux'
import examples from '../examples';
import centroid from '@turf/centroid';
const defaultCenter = centroid(examples[0].feature).geometry.coordinates;

const initialState = {
  zoom: 8.384504138687937,
  center: defaultCenter
}

const reducer = (state = initialState, action) => {
  const map = action.map
  switch (action.type) {
    case MapActionTypes.zoom:
      return {
        ...state,
        zoom: map.getZoom()
      }
      break;
    case MapActionTypes.moveend:
      // case MapActionTypes.move:
      return {
        ...state,
        center: map.getCenter()
      }
      break;
    case MapActionTypes.sync:
      return {
        ...state,
        center: map.getCenter(),
        zoom: map.getZoom()
      }
    default:
      return state
  }
}

export default reducer