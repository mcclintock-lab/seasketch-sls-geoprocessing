const { createSQSHandler } = require('./index');
const validateUUID = require('uuid-validate');
const knex = require("../knex");


const extractRequestId = (str) => {
  const match = str.match(
    /([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i
  );
  if (match && match.length) {
    return match[0];
  } else {
    return null;
  }
}

// Create a log matching our database schema from cloudwatch log messages
const createMessage = (data, idHint) => ({
  requestId: extractRequestId(data.message) || idHint,
  id: data.id,
  timestamp: new Date(parseInt(data.timestamp)),
  message: data.message,
  type: /Task timed out/.test(data.message) ||
    /errorMessage/.test(data.message) ||
    /stackTrace/.test(data.message) ? "stderr" : "info",
  // technically there may be multiple "last" log messages since "Task timed out" comes after
  // REPORT RequestId. createMessages() will have to clean these up.
  last: /REPORT RequestId/.test(data.message) || /Task timed out/.test(data.message)
})

const createMessages = (data) => {
  // Do one pass over to convert data to log message schema
  var messages = [];
  var requestId = null;
  for (let d of data) {
    const message = createMessage(d, requestId);
    if (!requestId && message.requestId) {
      requestId = message.requestId;
    }
    messages.push(message);
  }
  // If no requestIds were ever found then these are junk. discard
  if (!requestId) {
    return [];
  } else {
    // Pass over the messages again to assign a requestId to those that didn't have them explicitly
    // embedded in their log messages
    for (let message of messages) {
      if (!message.requestId) {
        message.requestId = requestId;
      }
    }
    // Make sure there is only one "last" log message
    const lastMessages = messages.filter((m) => m.last);
    if (lastMessages > 1) {
      lastMessages.sort((a, b) => b.timestamp - a.timestamp).slice(1)
        .forEach((m) => m.last = false);
    }
    return messages;
  }
}

const getInvocationId = (str) => {
  const match = str.match(/invocationId: ([0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i);
  if (match && match.length === 2) {
    return match[1];
  } else {
    return false;
  }
}

// Grabs logs from cloudwatch logs->sqs pipeline. Logs are unstructured so it's complicated :(
module.exports = createSQSHandler(process.env.REPORT_LOG_SQS, async (message, debug, txn) => {
  const invocationIds = [];
  const {id, timestamp, ...data} = JSON.parse(message.Body);
  const messages = createMessages(Object.values(data));
  debug("messages");
  debug(messages);
  await knex("logs").transacting(txn).insert(messages);
  const logsComplete = {};
  const failed = {};
  for (let message of messages) {
    const invocationId = getInvocationId(message.message);
    if (invocationId) {
      invocationIds.push(invocationId);
      await knex("invocations")
        .where("uuid", invocationId)
        .transacting(txn)
        .update({
          requestId: message.requestId
        })
      await knex("invocations")
        .where("uuid", invocationId)
        .where('status', 'requested')
        .transacting(txn)
        .update({
          status: 'running'
        })
    }
    if (message.type === 'stderr') {
      failed[message.requestId] = true;
    }
    if (message.last) {
      logsComplete[message.requestId] = true;
    }
    if (/REPORT RequestId/.test(message.message)) {
      const billedDurationMs = /Billed Duration: (\d+) ms/.exec(
        message.message
      )[1];
      const memorySizeMb = /Memory Size: (\d+) MB/.exec(
        message.message
      )[1];
      const maxMemoryUsedMb = /Max Memory Used: (\d+) MB/.exec(
        message.message
      )[1];
      await knex("invocations")
        .where("request_id", message.requestId)
        .transacting(txn)
        .update({
          billedDurationMs,
          memorySizeMb,
          maxMemoryUsedMb
        });
    }
  }

  for (let requestId in failed) {
    await knex("invocations")
      .where("requestId", requestId)
      .transacting(txn)
      .update({
        status: "failed",
        closed: logsComplete[requestId]
      });
  }
  for (let requestId in logsComplete) {
    await knex("invocations")
      // TODO
      .where("requestId", requestId)
      .where("status", "failed")
      .orWhereNotNull("results")
      .transacting(txn)
      .update({
        closed: true
      })
  }
  const requestIds = messages.map((m) => m.requestId);
  const rows = await knex("invocations").select("uuid").whereIn("requestId", requestIds);
  return rows.map((r) => r.uuid);
});
