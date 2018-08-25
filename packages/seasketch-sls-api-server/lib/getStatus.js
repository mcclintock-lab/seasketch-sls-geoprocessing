const asInvocation = require('./asInvocation');
const knex = require("./knex");
const COST_PER_GB_SECOND = 0.00001667;
const APPROX_SQS_COST =
  0.0000004 * // per message
  (1 + // results message
    3); // log messages
const COST_PER_REQUEST = 0.0000002;

module.exports = async (invocationId) => {
  const rows = await knex
    .select("*")
    .from("invocations")
    .where("uuid", invocationId);
  if (!rows || rows.length === 0) {
    createError(404, "Invocation ID not found");
  }
  const status = rows[0];
  var logs = [];
  if (status.requestId) {
    logs = await knex("logs")
      .select("timestamp", "message", "id", "type", "last")
      .where("requestId", status.requestId)
      .orWhere("requestId", invocationId)
      .orderBy("timestamp", "asc");
  }
  return {
    ...asInvocation(status),
    logs: logs
  };
};
