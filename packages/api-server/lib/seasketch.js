const geojson = require('../../seasketch-sls-geoprocessing/function_template/examples/sketch.json');

module.exports = {
  fetchSketch: async (id) => {
    return geojson;
  }
}
