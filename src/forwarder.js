const zlib = require("zlib");
const { promisify } = require("util");
const gunzip = promisify(zlib.gunzip);
const AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "us-west-2" });

// Create an SQS service object
var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

var params = {
  DelaySeconds: 0,
  QueueUrl: process.env.SQS_ENDPOINT
};

// Setup in the serverless.yml config to recieve cloudwatch logs from projects
// that use the framework
exports.handler = async (event, context) => {
  const payload = new Buffer(event.awslogs.data, "base64");
  const res = await gunzip(payload);
  const parsed = JSON.parse(res.toString("utf8"));
  if (parsed.logEvents.length) {
    params.MessageBody = JSON.stringify(parsed.logEvents);
    return sqs.sendMessage(params).promise();
  } else {
    return;
  }
};
