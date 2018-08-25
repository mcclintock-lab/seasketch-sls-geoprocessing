const knex = require("./knex");
const debug = require('./debug');
const failInvocation = require('./failInvocation');

// close and status=failed invocations that run past their timeout or worker_timeout

const checkTimeouts = async () => {
  const invocations = await knex('invocations').whereNotIn('status', ['complete', 'failed']);
  for (let invocation of invocations) {
    const func = await knex('functions')
      .where('project_name', invocation.project)
      .where('name', invocation.function)
      .first();
    if (!func) {
      // add a log saying you can't find an associated function and kill
      await failInvocation(invocation.uuid, 
        `Could not find ${invocation.project}-geoprocessing-${invocation.function} associated with invocation ${invocation.uuid}.`);
    } else {
      // check whether exceeded timeout or worker_timeout
      const timeout = func.workerTimeout * 60 * 1000 || func.timeout * 1000;
      const shouldBeCompletedBy = new Date(new Date(invocation.requestedAt).getTime() + timeout)
      if (shouldBeCompletedBy < new Date()) {
        await failInvocation(invocation.uuid, `Invocation timeout of ${timeout / 1000 / 60} minutes exceeded`);
      } else {
        // do nothing
      }
    }
  }
}

module.exports = checkTimeouts;