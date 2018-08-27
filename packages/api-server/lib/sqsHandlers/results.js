const { createSQSHandler } = require('./index');
const validateUUID = require('uuid-validate');
const knex = require("../knex");
const failInvocation = require('../failInvocation');

// Grabs results off the queue and saves them to invocations. In the case of ec2 functions it
// updates invocation status and metadata.
module.exports = createSQSHandler(process.env.REPORT_RESULT_SQS, async (message, debug, txn) => {
  // Message is sent directly by seasketch-sls-geoprocessing code so it should match this schema
  const {
    invocationId,
    results,
    duration,
    requestId
  } = JSON.parse(message.Body);
  debug(`Received results for ${invocationId}`);
  if (validateUUID(invocationId, 4)) {
    const status = await knex("invocations")
      .transacting(txn)
      .select("amiHandler", "status").where("uuid", invocationId).first();
    if (!status) {
      debug(`No invocation matching ${invocationId}. Discarding.`);
    } else if (status.amiHandler) {
      if (status.status === 'worker-booting' || status.status === 'worker-running') {
        debug('status worker-booting or worker-running')
        const hasLastLog = await knex("logs").transacting(txn)
          .count("requestId").where("last", true).where("requestId", invocationId);
        await knex("invocations")
          .where("uuid", invocationId)
          .transacting(txn)
          .update({
            status: "complete",
            duration,
            results,
            delivered_at: new Date(),
            closed: hasLastLog > 0
          });
      } else if (!results.worker || !results.worker.instanceId || !results.worker.instanceType) {
        debug(`Unimplemented!: failInvocation ${invocationId}`);
        await failInvocation(invocationId,
          "Function should be an amiHandler but returned no worker details in results.")
      } else {
        debug(results)
        await knex("invocations")
          .transacting(txn)
          .where("uuid", invocationId)
          .update({
            instance_id: results.worker.instanceId,
            instance_type: results.worker.instanceType,
            request_id: requestId,
            status: "worker-booting"
          });
      }
    } else {
      const hasLastLog = await knex("logs").transacting(txn)
        .count("requestId").where("last", true).where("requestId", requestId);
      debug(`setting status = complete for invocationId=${invocationId}`)
      await knex("invocations")
        .where("uuid", invocationId)
        .transacting(txn)
        .update({
          status: "complete",
          duration,
          results,
          request_id: requestId,
          delivered_at: new Date(),
          closed: hasLastLog > 0
        });
    }
    return invocationId;
  } else {
    debug(`Invalid uuid ${invocationId}. Discarding message.`);
  }
});
