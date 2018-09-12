const knex = require("./knex");
const mongoose = require("mongoose");
if (process.env.SEASKETCH_DB) {
  console.log("connecting to seasketch db", process.env.SEASKETCH_DB);
  mongoose.connect(process.env.SEASKETCH_DB);
}
const Sketch = mongoose.model("Sketch", {
  editedAt: Date,
  attributes: Object,
  name: String,
  sketchclass: String,
  preprocessedgeometryid: mongoose.Schema.Types.ObjectId,
  parentid: mongoose.Schema.Types.ObjectId
});
const LargeGeometry = mongoose.model("LargeGeometry", { geometry: Object });

const FormAttributeSchema = mongoose.model("FormAttribute", {
  sketchclassid: String,
  name: String,
  exportid: String
});

const esriUtils = require("@esri/arcgis-to-geojson-utils");
const proj = require("@turf/projection");

const exportId = f => {
  return (
    f.get("exportid") ||
    f
      .get("name")
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/\./g, "")
      .replace("&", "") // messes with JOINs in ArcMap
      .slice(0, 13)
  );
};

const getProperties = async sketch => {
  const attributeIds = Object.keys(sketch.attributes).filter((id) => mongoose.Types.ObjectId.isValid(id));
  
  const formAttributes = await FormAttributeSchema.find(
    {
      _id: { $in: attributeIds }
    },
    "exportid name _id"
  );
  const exportIds = formAttributes.reduce((m, a) => {
    m[a._id.toString()] = exportId(a);
    return m;
  }, {});
  const sketchAttributes = sketch.get("attributes");
  const attrs = Object.keys(sketchAttributes).reduce((m, id) => {
    m[exportIds[id]] = sketchAttributes[id];
    return m;
  }, {});
  return {
    ...attrs,
    id: sketch._id.toString(),
    createdAt: sketch.get("createdAt"),
    deletedAt: sketch.get("deletedAt"),
    updatedAt: sketch.get("editedAt"),
    sketchClassId: sketch.get("sketchclass"),
    parentId: sketch.get("parentid"),
    NAME: sketch.get("name"),
    staticGeometry: sketch.get("staticGeometry")
  };
};

const getGeometry = async sketch => {
  if (!sketch.get("preprocessedgeometryid")) {
    throw new Error(`No preprocessedgeometryid for sketch ${sketch._id}`);
  }
  const geometry = await LargeGeometry.findById(
    sketch.get("preprocessedgeometryid")
  );
  return proj.toWgs84(esriUtils.arcgisToGeoJSON(geometry.geometry.features[0]));
};

const getGeoJSON = async sketch => {
  const properties = await getProperties(sketch);
  if (sketch.get("preprocessedgeometryid")) {
    // not collection
    const geometry = await getGeometry(sketch);
    return {
      type: "Feature",
      properties,
      geometry
    };
  } else {
    // is collection
    const children = await Sketch.find({ parentid: sketch._id });
    const features = await Promise.all(children.map(getGeoJSON));
    return {
      type: "FeatureCollection",
      properties,
      features
    };
  }
};

module.exports = {
  fetchCacheOrGeometry: async (project, func, sketchId) => {
    if (!process.env.SEASKETCH_DB) {
      return { cache: false, geometry: false };
    }
    const sketch = await Sketch.findById(sketchId, {
      lean: false
    });
    if (!sketch) {
      return { cache: null, geometry: null };
    } else {
      const invocation = await knex("invocations")
        .where("requested_at", ">=", sketch.editedAt.toISOString())
        .where("sketch_id", sketch._id.toString())
        .where("project", project)
        .where("function", func)
        .whereNot("status", "failed")
        .first();
      if (invocation) {
        return { cache: invocation };
      } else {
        const geojson = await getGeoJSON(sketch);
        return { geometry: geojson };
      }
    }
  }
};
