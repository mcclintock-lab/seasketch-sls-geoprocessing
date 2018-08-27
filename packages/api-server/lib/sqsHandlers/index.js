const debug = require("debug")("seasketch-sls-geoprocessing:sqsHandler");
const knex = require("../knex");
// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");

// Set the region
AWS.config.update({ region: process.env.AWS_REGION });

// Create the SQS service object
var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

// Constructs a function that when called with an error handler will listen to an sqs url and apply
// the async handler function to each message. Messages will be deleted after processing unless an
// error is thrown by the handler.
const createSQSHandler = (queueUrl, handler) => {
  // setup a debug namespace for the handler to use
  const label = queueUrl.split('/').pop();
  const debugNamespace = require("debug")(`seasketch-sls-geoprocessing:sqsHandler:${label}`);
  // return a function that can be called to initialize the listener with an error handler
  const outerHandler = async (errorHandler) => {
    try {
      // fetch messages from sqs
      const data = await sqs
        .receiveMessage({
          QueueUrl: queueUrl,
          AttributeNames: ["SentTimestamp"],
          MaxNumberOfMessages: 4,
          MessageAttributeNames: ["All"],
          WaitTimeSeconds: 20
        }).promise();
      // in case of oddly formed logs
      const messages = data.Messages || [];
      debug(`Received ${messages.length} messages from ${label}`);
      if (messages.length) {
        var updateIds = [];
        // Each message is processed one-at-a-time
        await knex.transaction(async txn => {
          await Promise.all(
            messages.map(async message => {
              // handlers are expected to return the ids of invocations they have updated
              const invocationIds = await handler(message, debugNamespace, txn);
              if (invocationIds) {
                if (Array.isArray(invocationIds)) {
                  updateIds = [...updateIds, ...invocationIds];
                } else {
                  updateIds.push(invocationIds);
                }
              }
              // after calling the handler (assuming no exceptions) remove the message from sqs
              var deleteParams = {
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle
              };
              return sqs.deleteMessage(deleteParams).promise();
            })
          );
        });
      }
      // start again, waiting for more messages
      outerHandler(errorHandler);
    } catch (e) {
      debug("Caught error");
      debug(e);
      errorHandler(e);
    }
  }
  return outerHandler;
}

module.exports = {
  createSQSHandler: createSQSHandler
}
