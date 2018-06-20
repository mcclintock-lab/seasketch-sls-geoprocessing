import { asHandler } from "seasketch-sls-geoprocessing";
import area from "@turf/area";

const calculateArea = async (sketch) => {
  return {
    area: area(sketch)
  }
}

export default calculateArea;
export const handler = asHandler(calculateArea);