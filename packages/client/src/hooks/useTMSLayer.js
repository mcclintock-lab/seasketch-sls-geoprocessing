import MapContext from '../MapContext';
import { useContext, useState, useEffect, useRef } from 'react';


function useTMSLayer(urlTemplate, initiallyVisible=false) {
  const { addTMSLayer, toggleLayer, removeLayer } = useContext(MapContext);
  const [visible, setVisible] = useState(initiallyVisible);
  const layerId = useRef();
  useEffect(() => {
    if (!layerId.current) {
      layerId.current = addTMSLayer(urlTemplate, initiallyVisible);
    }
    return () => {
      removeLayer(layerId.current);
    }
  }, [layerId]);

  function onToggleLayer() {
    setVisible(!visible);
    toggleLayer(layerId.current, !visible);
  }

  return [visible, onToggleLayer];

}

export default useTMSLayer;