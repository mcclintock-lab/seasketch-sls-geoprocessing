import { asHandler } from "seasketch-sls-geoprocessing";
import area from "@turf/area";

const calculateArea = async (sketch) => {
  return {
    area: area(sketch)
  }
}

export default calculateArea;
export const handler = asHandler(calculateArea);

// More complex example:
// import { handler, s3PUT } from "seasketch-sls-geoprocessing";
//
// export default handler(async (sketches) => {
//   const base64MapData = "...";
//   const mapURL = await s3PUT("map.png", base64MapData);
//   return {
//     map: mapURL
//   }
// });
