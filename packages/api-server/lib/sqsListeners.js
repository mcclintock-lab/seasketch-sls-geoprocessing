const debug = require("./debug");
const knex = require("./knex");
// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: process.env.AWS_REGION });
const { updatePrices } = require("./ec2Pricing");

// Create the SQS service object
var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

const resultQueueURL = process.env.REPORT_RESULT_SQS;
const logQueueURL = process.env.REPORT_LOG_SQS;
const metadataQueueURL = process.env.METADATA_SQS;
const clientQueueURL = process.env.CLIENT_METADATA_SQS;
const uuid = require("uuid/v4");
const uuidpattern = /([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i;

const getClientMetadataMessages = async errorHandler => {
  try {
    const data = await sqs
      .receiveMessage({
        AttributeNames: ["SentTimestamp"],
        MaxNumberOfMessages: 4,
        MessageAttributeNames: ["All"],
        QueueUrl: clientQueueURL,
        WaitTimeSeconds: 20
      })
      .promise();
    await Promise.all(
      (data.Messages || []).map(async message => {
        const {
          project,
          clients,
          bundle,
          apiServerBundle,
          git,
          bundleSize,
          requiredClientVersion,
          requiredPackagingVersion
        } = JSON.parse(message.Body);
        await knex("projects")
          .where("name", project)
          .update({
            clients: JSON.stringify({
              bundle,
              apiServerBundle,
              requiredClientVersion,
              requiredPackagingVersion,
              modules: clients
            }),
            updated_at: new Date(),
            git: git,
            bundle_size: bundleSize
          });
        var deleteParams = {
          QueueUrl: clientQueueURL,
          ReceiptHandle: message.ReceiptHandle
        };
        return sqs.deleteMessage(deleteParams).promise();
      })
    );
    getClientMetadataMessages(errorHandler);
  } catch (e) {
    errorHandler(e);
  }
};

const getMetadataMessages = async errorHandler => {
  try {
    const data = await sqs
      .receiveMessage({
        AttributeNames: ["SentTimestamp"],
        MaxNumberOfMessages: 4,
        MessageAttributeNames: ["All"],
        QueueUrl: metadataQueueURL,
        WaitTimeSeconds: 20
      })
      .promise();
    await Promise.all(
      (data.Messages || []).map(async message => {
        const {
          name,
          region,
          center,
          zoom,
          project,
          defaultMemorySize,
          functions,
          git
        } = JSON.parse(message.Body);
        return knex.transaction(async txn => {
          var results = await knex("projects")
            .transacting(txn)
            .count("name")
            .where("name", name);
          if (results[0].count == 1) {
            await knex("projects")
              .where("name", name)
              .transacting(txn)
              .update({
                region,
                center: JSON.stringify(center),
                zoom,
                project,
                updated_at: new Date(),
                git
              });
          } else {
            await knex("projects")
              .transacting(txn)
              .insert({
                name,
                region,
                center: JSON.stringify(center),
                zoom,
                project,
                updated_at: new Date(),
                git
              });
          }
          for (var func of functions) {
            var results = await knex("functions")
              .transacting(txn)
              .where("function_name", func.functionName)
              .count("name");
            if (results[0].count == 1) {
              debug(`Received update to ${func.functionName}`);
              await knex("functions")
                .transacting(txn)
                .where("function_name", func.functionName)
                .update({
                  project_name: name,
                  name: func.name,
                  description: func.description,
                  timeout: func.timeout,
                  memory_size: func.memorySize,
                  outputs: func.outputs,
                  launch_template: func.launchTemplate,
                  instance_type: func.instanceType,
                  worker_timeout: func.workerTimeout
                });
            } else {
              debug(`Registered new function to ${func.functionName}`);
              await knex("functions")
                .transacting(txn)
                .insert({
                  project_name: name,
                  function_name: func.functionName,
                  name: func.name,
                  description: func.description,
                  timeout: func.timeout,
                  memory_size: func.memorySize,
                  outputs: func.outputs,
                  launch_template: func.launchTemplate,
                  instance_type: func.instanceType,
                  worker_timeout: func.workerTimeout
                });
            }
          }
          var deleteParams = {
            QueueUrl: metadataQueueURL,
            ReceiptHandle: message.ReceiptHandle
          };
          return sqs.deleteMessage(deleteParams).promise();
        });
      })
    );
    if (data && data.Messages && data.Messages.length) {
      updatePrices();
    }
    getMetadataMessages(errorHandler);
  } catch (e) {
    errorHandler(e);
  }
};

// const getResultMessages = require('./sqsHandlers/results');
// const getResultMessages = async errorHandler => {
//   try {
//     const data = await sqs
//       .receiveMessage({
//         AttributeNames: ["SentTimestamp"],
//         MaxNumberOfMessages: 4,
//         MessageAttributeNames: ["All"],
//         QueueUrl: resultQueueURL,
//         WaitTimeSeconds: 20
//       })
//       .promise();
//     if (data && data.Messages && data.Messages.length) {
//       debug(`Received ${data.Messages.length} message${data.Messages.length === 1 ? '' : 's'} from results sqs.`);
//     }
//     await Promise.all(
//       (data.Messages || []).map(async message => {
//         const { invocationId, results, duration, requestId } = JSON.parse(
//           message.Body
//         );
//         if (uuidpattern.test(invocationId)) {
//           const status = await knex("invocations").select("amiHandler").where("uuid", invocationId);
//           if (status[0] && status[0].amiHandler && results.worker) {
//             debug("Is ami_handler");
//             debug("Setting status to worker-booting")
//             await knex("invocations")
//               .where("uuid", invocationId)
//               .update({
//                 instance_id: results.worker.instanceId,
//                 instance_type: results.worker.instanceType,
//                 request_id: requestId,
//                 status: "worker-booting"
//               });
//           } else {
//             const hasLastLog = await knex("logs").count("requestId").where("requestId", requestId);
//             debug("not ami_handler");
//             await knex("invocations")
//               .where("uuid", invocationId)
//               .update({
//                 status: "complete",
//                 duration,
//                 results,
//                 request_id: requestId,
//                 delivered_at: new Date(),
//                 closed: hasLastLog > 0
//               });
//           }
//           pubsub.update(invocationId);
//         } else {
//           debug(`Invalid uuid ${invocationId}. Discarding messages.`);
//         }
//         var deleteParams = {
//           QueueUrl: resultQueueURL,
//           ReceiptHandle: message.ReceiptHandle
//         };
//         return sqs.deleteMessage(deleteParams).promise();
//       })
//     );
//     getResultMessages(errorHandler);
//   } catch (e) {
//     errorHandler(e);
//   }
// };

const getRequestId = msg => {
  debug("Will match");
  const match = msg.message.match(
    /([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i
  );
  debug(match);
  if (match && match.length) {
    return match[0];
  } else {
    return false;
  }
};

const findRequestId = messages => {
  debug("findRequestId");
  if (messages.amiHandler) {
    debug(`Found amiHandler ${messages.amiHandler}`);
    return messages.amiHandler;
  }
  for (var msg of messages) {
    if (msg.messages) {
      for (var message of msg.messages) {
        var id = getRequestId(message);
        if (id) {
          return id;
        }
      }
    } else {
      var id = getRequestId(msg);
      if (id) {
        return id;
      }
    }
  }
  debug("could not find requestId");
  return false;
};

const assignRequestId = (message, defaultId) => {
  message.request_id = getRequestId(message) || defaultId;
  debug("assigned");
  debug(message);
};

const assignRequestIds = messages => {
  var requestId = findRequestId(messages);
  debug(`requestId = ${requestId}`);
  if (requestId) {
    debug("in if block");
    debug(messages);
    debug(typeof messages);
    if (messages.messages) {
      debug("yes, messages");
      debug(typeof messages.messages);
      for (var msg of messages.messages) {
        debug("assign", msg);
        assignRequestId(msg, requestId);
      }
    } else {
      for (var message of messages) {
        if (message.messages) {
          for (var msg of message.messages) {
            assignRequestId(msg, requestId);
          }
        } else {
          assignRequestId(message, requestId);
        }
      }
    }
  }
  debug("after assignRequestIds");
  debug(messages);
  if (messages.messages) {
    return messages.messages;
  } else {
    return messages;
  }
};

const getLogMessages = async errorHandler => {
  try {
    const data = await sqs
      .receiveMessage({
        AttributeNames: ["SentTimestamp"],
        MaxNumberOfMessages: 4,
        MessageAttributeNames: ["All"],
        QueueUrl: logQueueURL,
        WaitTimeSeconds: 20
      })
      .promise();
    // This should probably all be wrapped in a txn so it can be repeated if
    // there are errors
    debug(data);
    var messages = [];
    var messagesForInsert = [];
    const handles = [];
    (data.Messages || []).forEach(message => {
      try {
        const msgs = JSON.parse(message.Body);
        messages = messages.concat(assignRequestIds(msgs));
      } catch (e) {
        // do nothing if theres a parsing error. Just throw it out
      }
      handles.push(message.ReceiptHandle);
    });
    if (messages.length) {
      debug(
        `Received ${messages.length} message${
          messages.length === 1 ? "" : "s"
        } from log sqs.`
      );
    }

    var invocationIds = [];
    var requestIds = [];
    await knex.transaction(async trx => {
      for (let message of messages) {
        if (message.messages) {
          messagesForInsert = [
            ...messagesForInsert,
            ...message.messages.filter(m => m.request_id)
          ];
        } else {
          if (message.request_id) {
            messagesForInsert = [...messagesForInsert, message];
          }
        }
      }
      for (let message of messagesForInsert) {
        debug(message);
        if (message.type && message.type.length && message.request_id) {
          // is a worker. update status
          if (invocationIds.indexOf(message.request_id) === -1) {
            debug(`Adding ${message.request_id} to invocationIds`);
            invocationIds.push(message.request_id);
          }
        } else {
          // need to update status, but don't have invocation uuid (request_id is different)
          if (requestIds.indexOf(message.request_id) === -1) {
            debug(`Adding ${message.request_id} to invocations to requestIds`);
            requestIds.push(message.request_id);
          }
        }
        // will be inserted into the database
        message.timestamp = new Date(parseInt(message.timestamp));
        // Check if it contains uuid that needs associating with a requestId
        const invokeIdMatch = message.message.match(
          /invocationId: ([0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})/i
        );
        if (invokeIdMatch && invokeIdMatch.length === 2) {
          let invocationId = invokeIdMatch[1];
          if (invocationIds.indexOf(invocationId) === -1) {
            invocationIds.push(invocationId);
          }
          debug("invokeIdMatch");
          debug(invokeIdMatch);
          await knex("invocations")
            .where("uuid", invocationId)
            .where("status", "requested")
            .transacting(trx)
            .update({
              status: "running",
              request_id: message.request_id
            });
        }
        // Check for errors
        // TODO: This might not work correctly with ec2 workers since
        // request_id could be different
        if (
          message.message.indexOf("errorMessage") != -1 ||
          /Task timed out/.test(message.message)
        ) {
          debug("error message");
          debug(message.message);
          message.type = "stderr";
          await knex("invocations")
            .where("request_id", message.request_id)
            .whereNull("results") // in case results are already in
            .transacting(trx)
            .update({
              status: "failed"
            });
        }
        if (
          /SLS_LOGS_COMPLETE|END RequestId|errorMessage|Task timed out/.test(
            message.message
          )
        ) {
          debug(`setting message as last ${message.request_id}`);
          message.last = true;
          await knex("invocations")
            .where("request_id", message.request_id)
            .whereNotNull("results")
            .orWhere("status", "failed")
            .transacting(trx)
            .update({
              closed: true
            });
        }

        // Check for processes ending
        if (message.message.indexOf("REPORT RequestId") === 0) {
          const billed_duration_ms = /Billed Duration: (\d+) ms/.exec(
            message.message
          )[1];
          const memory_size_mb = /Memory Size: (\d+) MB/.exec(
            message.message
          )[1];
          const max_memory_used_mb = /Max Memory Used: (\d+) MB/.exec(
            message.message
          )[1];
          await knex("invocations")
            .where("request_id", message.request_id)
            .transacting(trx)
            .update({
              billed_duration_ms,
              memory_size_mb,
              max_memory_used_mb
            });
          // Do this afterwards so that status=failed isn't overwritten
          await knex("invocations")
            .where("request_id", message.request_id)
            .where("status", "running")
            .where("ami_handler", false)
            .transacting(trx)
            .update({
              status: "complete"
            });
        }
        if (message.type && message.type === "command") {
          debug("setting status to worker-running");
          await knex("invocations")
            .where("uuid", message.request_id)
            .where("ami_handler", true)
            .transacting(trx)
            .update({
              status: "worker-running"
            });
        }
      }

      debug(JSON.stringify(messagesForInsert));

      debug("inserting messages...");
      debug(messagesForInsert);
      await knex("logs")
        .insert(messagesForInsert)
        .transacting(trx);

      // delete all sqs messages
      await Promise.all(
        handles.map(handle => {
          var deleteParams = {
            QueueUrl: logQueueURL,
            ReceiptHandle: handle
          };
          return sqs.deleteMessage(deleteParams).promise();
        })
      );
    });
    // start again
    getLogMessages(errorHandler);
  } catch (e) {
    console.error(e);
    errorHandler(e);
  }
};

module.exports = {
  init: errorHandler => {
    require("./sqsHandlers/lambda")(errorHandler);
    require("./sqsHandlers/ec2logs")(errorHandler);
    require("./sqsHandlers/results")(errorHandler);
    // getResultMessages(errorHandler);
    // getLogMessages(errorHandler);
    getMetadataMessages(errorHandler);
    getClientMetadataMessages(errorHandler);
  }
};
