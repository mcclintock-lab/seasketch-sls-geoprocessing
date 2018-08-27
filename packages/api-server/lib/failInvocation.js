const knex = require("./knex");
const debug = require('./debug');
const uuid = require('uuid/v4');

module.exports = async (id, reason,) => {
  debug(`Failing invocation ${id}. ${reason}`)
  await knex('logs')
    .insert({
      id: uuid(),
      timestamp: new Date(),
      message: reason,
      last: true,
      type: 'info',
      requestId: id
    });
  await knex('invocations')
    .where('uuid', id)
    .update({
      status: 'failed',
      closed: 'true'
    })
  return
}