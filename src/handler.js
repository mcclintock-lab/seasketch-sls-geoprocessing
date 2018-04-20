// Wraps geoprocessing functions to meet lambda requirements
module.exports = geoprocessor => {
  return async (event, context) => {
    //
    var fs = event.body ? JSON.parse(event.body) : event;
    const response = await geoprocessor(fs);
    return {
      statusCode: 200,
      isBase64Encoded: false,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true
      },
      body: JSON.stringify(response)
    };
  };
};
