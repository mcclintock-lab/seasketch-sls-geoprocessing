import { handler } from "seasketch-sls-geoprocessing";
import area from "@turf/area";

export default handler((sketch) => {
  return {
    area: area(sketch)
  };
});

// // Alternatively, an async report would look like this
// import { handler, s3PUT } from "seasketch-sls-geoprocessing";
//
// export default handler(async (sketches) => {
//   const base64MapData = "...";
//   const mapURL = await s3PUT("map.png", base64MapData);
//   return {
//     map: mapURL
//   }
// });
