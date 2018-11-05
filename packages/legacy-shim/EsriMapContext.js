dojo.declare("my.TMSLayer", esri.layers.WebTiledLayer, {
  getTileUrl: function(level, row, col) {
    const [z, x, y] = [level, col, row];
    return this.url.replace('{z}', z).replace('{x}', x).replace('{y}', (1 << z) - y - 1);
  }
});

const contexts = {};

class EsriMapContext {

  constructor(map) {
    this.map = map;
    this.layers = {};
  }

  addTMSLayer = (url, initiallyVisible, opacity) => {
    const map = this.map;
    const layerId = `layer-${url}`;
    const options = {};
    const layer = new my.TMSLayer(url, options);
    map.addLayer(layer);
    if (initiallyVisible !== undefined) {
      layer.setVisibility(initiallyVisible);
    } else {
      layer.setVisibility(true);
    }
    this.layers[layerId] = layer;
    layer.setOpacity(0.6);
    return layerId;
  }

  toggleLayer = (layerId, visible) => {
    const layer = this.layers[layerId];
    if (layer) {
      layer.setVisibility(visible);
    }
  }

  removeLayer = (layerId) => {
    const layer = this.layers[layerId];
    if (layer) {
      this.map.removeLayer(layer);
      delete this.layers[layerId];
    }
  }

}

export default (map) => {
  if (!map) {
    return null;
  }
  if (!contexts[map]) {
    contexts[map] = new EsriMapContext(map);
  }
  return contexts[map];
}