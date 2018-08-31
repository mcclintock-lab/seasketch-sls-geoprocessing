const knex = require("./knex");
const mongoose = require("mongoose");
if (process.env.SEASKETCH_DB) {
  console.log('connecting to seasketch db', process.env.SEASKETCH_DB);
  mongoose.connect(process.env.SEASKETCH_DB);
}
const Sketch = mongoose.model("Sketch", {
  editedAt: Date,
  attributes: Object,
  name: String,
  sketchclass: String,
  preprocessedgeometryid: mongoose.Schema.Types.ObjectId
});
const LargeGeometry = mongoose.model("LargeGeometry", { geometry: Object });

const FormAttributeSchema = mongoose.model("FormAttribute", {
  sketchclassid: String,
  name: String,
  exportid: String
});

const getStatus = require("./getStatus");
const Terraformer = require('terraformer');
const esriUtils = require('@esri/arcgis-to-geojson-utils');
const proj = require('@turf/projection');

module.exports = {
  fetchCacheOrGeometry: async (project, func, sketchId) => {
    console.log('fetch cache')
    if (!process.env.SEASKETCH_DB) {
      console.log('return nada');
      return {cache: false, geometry: false};
    }
    const sketch = await Sketch.findById(
      sketchId,
      "editedAt attributes name preprocessedgeometryid",
      {
        lean: false
      }
    );
    console.log('sketch?', sketch)
    if (!sketch) {
      return { cache: null, geometry: null };
    } else {
      const invocations = await knex("invocations")
        .where("requested_at", ">=", sketch.editedAt.toISOString())
        .where("sketch_id", sketch._id.toString())
        .whereNot("status", "failed")
        .limit(1);
      console.log('invocations?', invocations);
      if (invocations.length) {
        const data = await getStatus(invocations[0].uuid);
        return { cache: invocations[0] };
      } else {
        const geometry = await LargeGeometry.findById(
          sketch.preprocessedgeometryid
        );
        const geom = proj.toWgs84(esriUtils.arcgisToGeoJSON(geometry.geometry.features[0]));
        geom.properties = {
          ...sketch.attributes
        }
        return { geometry:  geom};
      }
    }
  }
};
