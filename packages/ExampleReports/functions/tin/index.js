import { asHandler } from "@seasketch-sls-geoprocessing/handlers";
import tin from "@turf/tin";
import explode from "@turf/explode";

const getTin = (sketch) => ({
  results: tin(explode(sketch))
});

// function exported as default for testing and reuse
export default getTin;
// must be exported by keyword 'handler'
export const handler = asHandler(getTin);