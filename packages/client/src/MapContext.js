import React from 'react';

const notImplementedError = () => {
  throw new Error("Method not implemented by MapContext");
}

const MapContext = React.createContext({
  addTMSLayer: (urlTemplate, initiallyVisible) => notImplementedError(),
  toggleTMSLayer: (layer, visible) => notImplementedError(),
  removeLayer: (layer) => notImplementedError()
});

export default MapContext;