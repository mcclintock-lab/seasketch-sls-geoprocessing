import { asHandler } from "seasketch-sls-geoprocessing";
import area from "@turf/area";

const calculateArea = async (sketch) => {
  return {
    area: area(sketch)
  }
}

// function exported as default for testing and reuse
export default calculateArea;
// must be exported by keyword 'handler'
export const handler = asHandler(calculateArea);