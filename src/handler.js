// Wraps geoprocessing functions. Has several purposes (incomplete):
//   * fetches sketches from seasketch if necessary (GET requests)
//   * determines if result is already in cache or function is already running
//   * responds with eta and metadata when using the async response protocol
//   * adds metadata like log locations and handles errors
//
// More details on the request/response protocol can be found here:
// https://github.com/mcclintock-lab/seasketch-next/wiki/Report-Request-Protocol
module.exports = geoprocessor => {
  return (event, context, callback) => {
    const response = geoprocessor(event);
    if (response.then) {
      // async. Not supported just yet
      throw new Error("Not yet supported");
    } else {
      callback(null, response);
    }
  };
};
