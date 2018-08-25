const AWS = require("aws-sdk");
const createError = require("http-errors");
const jsonSize = require("json-size");
const knex = require('./knex');
const uuid = require("uuid").v4;
const lambda = new AWS.Lambda({
  region: process.env.AWS_REGION || "us-west-2",
  apiVersion: "2015-03-31"
});
const STAGE = "geoprocessing";
const BASE_PARAMS = {
  ClientContext: "SeaSketchReportAPIServer",
  InvocationType: "Event",
  LogType: "None"
};

module.exports = async (project, func, geojson, sketch_id) => {
  const invocationId = uuid();
  const payloadSizeBytes = jsonSize(geojson);
  if (payloadSizeBytes > 128000) {
    throw createError(400, "Requested geometry size is > 128kb");
  }
  const params = {
    ...BASE_PARAMS,
    Payload: JSON.stringify({
      body: geojson,
      invocationId: invocationId,
      postToSQS: true
    }),
    FunctionName: `${project}-${STAGE}-${func}`
  };

  const durations = await knex.raw(
    `select avg(duration) from
      (select extract(epoch from age(delivered_at, requested_at)) as duration
        from invocations
        where project = ? and function = ? and status = 'complete'
        order by requested_at desc limit 5) as durations`, [project, func]);


  var eta = null;
  if (durations.rows && durations.rows.length && durations.rows[0].avg) {
    eta = new Date(new Date().getTime() + (parseInt(durations.rows[0].avg) * 1000));
  }

  const funcs = await knex('functions')
    .select('launch_template', 'price_per_hour')
    .where('project_name', project)
    .where('name', func)
    .limit(1)

  isAmiHandler = funcs.length && funcs[0].launchTemplate && !!funcs[0].launchTemplate.length

  const [a, b] = await Promise.all([
    knex.transaction((trx) => {
      return trx.insert({
        uuid: invocationId,
        project,
        function: func,
        requestedAt: new Date(),
        eta,
        payloadSizeBytes: payloadSizeBytes,
        sketch_id,
        status: "requested",
        amiHandler: isAmiHandler,
        pricePerHour: funcs[0].pricePerHour || null
      }).into('invocations').then(() => {
        return trx.insert({
          invocation_uuid: invocationId,
          payload: geojson,
        }).into('payloads');
      })
    }),
    lambda.invoke(params).promise()
  ]);
  return invocationId;
};
