const { createSQSHandler } = require('./index');
const validateUUID = require('uuid-validate');
const knex = require("../knex");

// Retreives logs from ec2 works and updates status in the invocations table
module.exports = createSQSHandler(process.env.EC2_LOG_SQS, async (message, debug, txn) => {
  // Message is sent directly by amiHandler so it should match this schema
  debug(message)
  const {
    amiHandler,
    messages
  } = JSON.parse(message.Body);
  if (validateUUID(amiHandler, 4) && messages && messages.length) {
    const uuid = amiHandler;
    // TODO: check to see that messages match required schema
    messages.forEach((m) => m.timestamp = new Date(parseInt(m.timestamp)))
    var complete = false;
    var failed = false;
    for (let message of messages) {
      if (/SLS_LOGS_COMPLETE/.test(message.message)) {
        complete = true;
        message.last = true;
      }
      if (/errorMessage/.test(message.message) || /run-ami-tasks failed/.test(message.message)) {
        failed = true;
        message.last = true;
      }
    }
    await knex("logs").transacting(txn).insert(messages);
    if (failed) {
      await knex("invocations")
        .where("uuid", uuid)
        .transacting(txn)
        .update({
          status: "failed",
          request_id: message.request_id,
          closed: true
        });
    } else if (complete) {
      await knex("invocations")
        .where("uuid", uuid)
        .whereNotNull("results")
        .orWhere("status", "failed")
        .transacting(txn)
        .update({
          closed: true
        });
    } else {
      await knex("invocations")
        .where("uuid", uuid)
        .where("status", "worker-booting")
        .transacting(txn)
        .update({
          "status": "worker-running"
        })
    }
    return uuid;
  } else {
    debug(`Invalid message. Discarding.`);
  }
});
