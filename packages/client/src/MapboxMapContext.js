const contexts = {};

class MapboxMapContext {

  constructor(map) {
    this.map = map;
    this.sources = {};
  }

  addTMSLayer = (url, initiallyVisible) => {
    const map = this.map;
    const layerId = `layer-${url}`;
    const sourceId = `source-${url}`;
    var source = {
        "scheme": "tms",
        "type": "raster",
        'tiles': [
            url
        ]
        // 'tileSize': 256,
        // 'bounds': [121.849365234, 41.428569989, 121.947212219, 41.4838910427]
    };
    var layer = {
        "id": layerId,
        "type": "raster",
        "source": sourceId,
        'paint': {},
        "layout": {
          'visibility': initiallyVisible ? 'visible' : 'none'
        }
    };
    map.addSource(sourceId, source);
    map.addLayer(layer);
    this.sources[layerId] = sourceId;
    return layerId;
  }

  toggleLayer = (layerId, visible) => {
    const map = this.map;
    const visibility = visible ? "visible" : "none";
    map.setLayoutProperty(layerId, 'visibility', visibility);
  }

  removeLayer = (layerId) => {
    this.map.removeLayer(layerId);
    this.map.removeSource(this.sources[layerId]);
    delete this.sources[layerId];
  }

}

export default (map) => {
  if (!map) {
    return null;
  }
  if (!contexts[map]) {
    contexts[map] = new MapboxMapContext(map);
  }
  return contexts[map];
}