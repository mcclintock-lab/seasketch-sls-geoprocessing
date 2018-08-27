const knex = require("./knex");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION });
var ec2 = new AWS.EC2()
const debug = require("./debug");
const uuid = require('uuid').v4;
const uuidpattern = /([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i;

var lastRunningInstances = 1;
// Monitors ec2 running instances to ensure that each tagged instance is tied
// to an invocation. If that invocation has violated it's timeout it will be
// shut down.
const checkRunningInstances = async () => {
  // get list of ec2 instances for this region
  // filter to those that have tag seasketch-sls-geoprocessing-worker=worker
  const data = await ec2.describeInstances({
    Filters: [{
      Name: "tag-key",
      Values: ["seasketch-sls-geoprocessing-worker"]
    }, {
      Name: "instance-state-name",
      Values: ["pending", "running"]
    }
  ]
  }).promise();
  let instances = [];
  for (var reservation of data.Reservations) {
    instances = [
      ...instances,
      ...reservation.Instances
    ];
  }
  if (instances.length || lastRunningInstances > 0) {
    debug(`Found ${instances.length} running ec2 instance${instances.length === 1 ? '' : 's'}`);
  }
  lastRunningInstances = instances.length;
  for (var instance of instances) {
    const launchTime = new Date(instance.LaunchTime);
    const functionName = (instance.Tags.find((t) => t.Key === 'function') || {}).Value;
    const invocationId = (instance.Tags.find((t) => t.Key === 'InvocationID') || {}).Value;
    const name = (instance.Tags.find((t) => t.Key === 'Name') || {}).Value;
    const instanceType = instance.InstanceType;
    const instanceId = instance.InstanceId;
    if (!functionName || !invocationId) {
      await terminateWorker({
        instanceId, instanceType, invocationId, functionName, launchTime
      }, `Worker does not have the correct tags (function, InvocationID).`);
    } else if (!uuidpattern.test(invocationId)) {
      await terminateWorker({
        instanceId, instanceType, invocationId, functionName, launchTime
      }, `Invalid uuid ${invocationId}. Discarding messages.`);
    } else {
      const func = await knex("functions").first().where("function_name", functionName);
      // search database for related invocations
      const invocation = await knex("invocations").first()
        .where("uuid", invocationId)
      // time-to-die
      let ttd = new Date(
        (launchTime).getTime() +
        (1000 * 60 * (func.workerTimeout || 10))
        // worker_timeout or 10 minutes in ms
      );
      if (invocation) {
        // terminate those exceeding their timeout
        if (new Date() > ttd) {
          await terminateWorker({
            instanceId, instanceType, invocationId, functionName, launchTime
          }, "Timeout exceeded.");
        }
      } else {
        debug("Found ec2 worker with no invocation record. Recording failed invocation and terminating.");
        // for those that don't have an invocation record, create one and add a log entry
        let project = "Unknown";
        let func = "Unknown";
        if (functionName) {
          project = functionName.split("-")[0];
          func = functionName.split("-")[2];
        }
        await knex("invocations").insert({
          uuid: invocationId,
          project: project,
          function: func,
          requested_at: launchTime,
          request_id: invocationId,
          payload_size_bytes: 0,
          status: "failed",
          ami_handler: true,
          instance_type: instanceType,
          instance_id: instanceId
        });
        await terminateWorker({
          instanceId, instanceType, invocationId, functionName, launchTime
        }, "Orphan worker without recorded invocation database entry.");
      }
    }
  }
}

const terminateWorker = async (instance, reason) => {
  reason = `Worker ${instance.instanceId} terminated by ec2InstanceMonitor. ${reason}`;
  debug(reason);
  await ec2.terminateInstances({InstanceIds: [instance.instanceId]}).promise();
  if (instance.invocationId && uuidpattern.test(instance.invocationId)) {
    // Change invocation status to failed and add to logs
    await Promise.all([
      knex("logs").insert({
        id: uuid(),
        request_id: instance.invocationId,
        timestamp: new Date(),
        type: "info",
        message: reason
      }),
      knex("invocations")
        .where("uuid", instance.invocationId)
        .whereNot("status", "complete")
        .update({
          status: 'failed',
          instance_id: instance.instanceId,
          instance_type: instance.instanceType,
          closed: true
        })
    ]);
  } else {
    // Create new placeholder invocation and create logs
    let invocationId = uuid();
    let project = "Unknown";
    let func = "Unknown";
    if (instance.functionName) {
      project = instance.functionName.split("-")[0];
      func = instance.functionName.split("-")[2];
    }
    await Promise.all([
      knex("logs").insert({
        id: uuid(),
        request_id: invocationId,
        timestamp: new Date(),
        type: "info",
        message: reason
      }),
      knex("invocations")
        .insert({
          project: project,
          function: func,
          requested_at: instance.launchTime,
          uuid: invocationId,
          request_id: invocationId,
          ami_handler: true,
          payload_size_bytes: 0,
          status: 'failed',
          instance_id: instance.instanceId,
          instance_type: instance.instanceType,
          closed: true
        })
    ]);
  }
}

module.exports = {
  init: () => {
    setInterval(checkRunningInstances, 10000);
  }
}
