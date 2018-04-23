const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION });
var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

var sqsParams = {
  DelaySeconds: 0,
  QueueUrl: process.env.RESULTS_SQS_ENDPOINT
};

// Wraps geoprocessing functions to meet lambda requirements
module.exports = geoprocessor => {
  const startTime = new Date().getTime();
  return async (event, context) => {
    var fs;
    if (event.body) {
      if (typeof event.body === 'string') {
        fs = JSON.parse(event.body);
      } else {
        fs = event.body;
      }
    } else {
      fs = event;
    }
    if (event.invocationId) {
      console.log(`invocationId: ${event.invocationId}`)
    }
    const response = await geoprocessor(fs);
    const results = {
      results: response,
      duration: new Date().getTime() - startTime,
      requestId: context.awsRequestId,
      invocationId: event.invocationId
    };
    if (event.postToSQS) {
      return sqs.sendMessage({
        ...sqsParams,
        MessageBody: JSON.stringify(results)
      }).promise();
    } else {
      return {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true
        },
        body: JSON.stringify(results)
      };
    }
  };
};
