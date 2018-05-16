const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.AWS_REGION });
var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

var sqsParams = {
  DelaySeconds: 0,
  QueueUrl: process.env.RESULTS_SQS_ENDPOINT
};
var lastRequestId = null;

// Wraps geoprocessing functions to meet lambda requirements
module.exports = geoprocessor => {
  return async (event, context) => {
    if (context.awsRequestId === lastRequestId) {
      // don't replay
      console.log('cancelling since event is being replayed');
      return null;
    } else {
      lastRequestId = context.awsRequestId;
    }
    const startTime = new Date().getTime();
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
    const response = await geoprocessor(fs, event.invocationId);
    const results = {
      results: response,
      duration: (new Date().getTime()) - startTime,
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
