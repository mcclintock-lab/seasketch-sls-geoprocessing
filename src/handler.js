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
    var fs = event.body ? JSON.parse(event.body) : event;
    const response = geoprocessor(fs);
    if (response.then) {
      // async. Not supported just yet
      throw new Error("Not yet supported");
    } else {
      callback(null, {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {
          "Access-Control-Allow-Origin" : "*",
          "Access-Control-Allow-Credentials" : true
        },
        body: JSON.stringify(response)
      });
    }
  };
};
