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
const esriUtils = require('@esri/arcgis-to-geojson-utils');
const proj = require('@turf/projection');

const exportId = (f) => {
  return f.exportid || f.name.toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/\./g, '')
    .replace("&", '') // messes with JOINs in ArcMap
    .slice(0, 13)
}

module.exports = {
  fetchCacheOrGeometry: async (project, func, sketchId) => {
    if (!process.env.SEASKETCH_DB) {
      return {cache: false, geometry: false};
    }
    const sketch = await Sketch.findById(
      sketchId,
      {
        lean: false
      }
    );
    if (!sketch) {
      return { cache: null, geometry: null };
    } else {
      const attributeIds = Object.keys(sketch.attributes);
      const formAttributes = await FormAttributeSchema.find({_id: {$in: attributeIds}})
      const exportIds = formAttributes.reduce((m, a) => {
        m[a._id.toString()] = exportId(a);
        return m;
      }, {})
      const invocations = await knex("invocations")
        .where("requested_at", ">=", sketch.editedAt.toISOString())
        .where("sketch_id", sketch._id.toString())
        .where("project", project)
        .where("function", func)
        .whereNot("status", "failed")
        .limit(1);
      if (invocations.length) {
        const data = await getStatus(invocations[0].uuid);
        return { cache: invocations[0] };
      } else {
        const geometry = await LargeGeometry.findById(
          sketch.preprocessedgeometryid
        );
        const geom = proj.toWgs84(esriUtils.arcgisToGeoJSON(geometry.geometry.features[0]));
          attrs = Object.keys(sketch.get('attributes')).reduce((m, id) => {
          m[exportIds[id]] = sketch.attributes[id];
          return m;
        }, {});
        geom.properties = {
          ...attrs,
          id: sketch._id.toString(),
          createdAt: sketch.get('createdAt'),
          deletedAt: sketch.get('deletedAt'),
          updatedAt: sketch.get('editedAt'),
          sketchClassId: sketch.get('sketchclass'),
          parentId: sketch.get('parentid'),
          NAME: sketch.get('name'),
          staticGeometry: sketch.get('staticGeometry')    
        }
        return { geometry:  geom};
      }
    }
  }
};
