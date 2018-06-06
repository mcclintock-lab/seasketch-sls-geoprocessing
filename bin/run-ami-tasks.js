#!/usr/bin/env node
const { spawn } = require("child_process");
const AWS = require("aws-sdk");
const { FAILURE } = require("../src/constants");
// Set the region
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

var messages = [];

const sendMessages = async () => {
  const incoming = messages;
  messages = [];
  if (incoming.length) {
    console.log(`sending ${incoming.length} messages`);
    const body = {
      amiHandler: process.env.INVOCATION_ID,
      messages: incoming
    };
    try {
      await sqs
        .sendMessage({
          MessageBody: JSON.stringify(body),
          QueueUrl: process.env.LOGS_SQS_ENDPOINT,
          DelaySeconds: 0
        })
        .promise();
    } catch (e) {
      console.error("Failed to send messages to sqs");
      messages = [...incoming, ...messages];
    }
  } else {
    return;
  }
};

const message = (msg, type) => {
  return {
    timestamp: new Date().getTime(),
    message: msg,
    type: type || "stdout"
  };
};

setInterval(sendMessages, 200);

const worker = spawn("stdbuf", [
  "-i0",
  "-o0",
  "-e0", //disable all buffering
  "bash",
  process.argv[2]
]);

worker.stdout.on("data", data => {
  messages.push(message(data.toString(), "stdout"));
});

worker.stderr.on("data", (data, e) => {
  if (data.toString().indexOf("+") === 0) {
    messages.push(
      message(data.toString().replace(/(^|\n)[\+]*\s/g, "$1"), "command")
    );
  } else {
    messages.push(message(data.toString(), "stderr"));
  }
});

worker.on("close", code => {
  if (code !== 0) {
    messages.push(message(`${FAILURE}: child process exited with code ${code}`));
  }
  sendMessages().then(() => process.exit(0));
});
