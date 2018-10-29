const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const ncp = require("ncp").ncp;
const AWS = require("aws-sdk");
const remoteOriginUrl = require('remote-origin-url');

const YAWN = require("yawn-yaml/cjs");
const YML_TEMPLATE = `${__dirname}/function_config.yml`;
const FUNCTION_TEMPLATE = `${__dirname}/function_template`;

var cloudformation = new AWS.CloudFormation({ region: "us-west-2" });
var sqs = new AWS.SQS({ apiVersion: "2012-11-05", region: "us-west-2" });

const createDirectories = (serverless, options) =>
  new Promise((resolve, reject) => {
    const from = FUNCTION_TEMPLATE;
    const to = `./functions/${options.name}`;
    serverless.cli.log(`Creating new function in ${to}`);
    ncp(from, to, e => {
      if (e) {
        reject(e);
      } else {
        resolve();
      }
    });
  });

const putMetadataToSQS = async (serverless, options) => {
  const exports = await cloudformation.listExports({}).promise();
  const bucket = exports.Exports.find(e => e.Name === "ReportOutputs").Value;
  var functions = [];
  for (var key in serverless.service.functions) {
    const func = serverless.service.functions[key];
    let amiMetadata = {};
    if (func.launchTemplate) {
      amiMetadata.launchTemplate = func.launchTemplate;
      amiMetadata.instanceType = func.instanceType;
      amiMetadata.workerTimeout = func.workerTimeout;
    }
    functions.push({
      name: key,
      functionName: func.name,
      description: func.description,
      timeout: func.timeout,
      memorySize: func.memorySize || serverless.provider.memorySize,
      outputs: `https://s3-${serverless.service.provider.region}.amazonaws.com/${bucket}/${func.environment.S3_KEY_PREFIX}`,
      ...amiMetadata
    })
  }
  const metadata = {
    name: serverless.service.service,
    region: serverless.service.provider.region,
    ...serverless.service.custom.geoprocessing,
    functions: functions,
    git: remoteOriginUrl.sync(`${process.cwd()}/.git/config`)
  };
  postDeployQueue = exports.Exports.find(
    e => e.Name === "PostDeployMetadataQueueEndpoint"
  ).Value;
  return sqs
    .sendMessage({
      MessageBody: JSON.stringify(metadata),
      QueueUrl: postDeployQueue,
      DelaySeconds: 0
    })
    .promise();
};

const updateYML = async (serverless, options) => {
  serverless.cli.log(`Updating serverless.yml`);
  var yml = await readFile(YML_TEMPLATE);
  yml = yml.toString().replace(/replace-me/g, options.name);
  const config = await readFile("./serverless.yml");
  let yawn = new YAWN(config.toString());
  const json = yawn.json;
  if (!json.functions) {
    json.functions = {};
  }
  json.functions[options.name] = new YAWN(yml).json;
  yawn.json = json;
  return await writeFile("./serverless.yml", yawn.yaml);
};

const renameSources = async (serverless, options) => {
  serverless.cli.log(`Updating sources in client/tabs/Example.js`);
  const doesExist = await exists("./client/tabs/Example.js");
  if (doesExist) {
    var data = await readFile("./client/tabs/Example.js")
    data = data.toString().replace("$project", serverless.service.service);
    data = data.replace("$functionName", options.name);
    return await writeFile("./client/tabs/Example.js", data);
  } else {
    serverless.cli.log(`Example tab no longer exists.`);
  }
}

const addCommonResources = (serverless, options) => {
  var provider = serverless.service.provider;
  // update environment
  if (!provider.environment) {
    provider.environment = {};
  }
  provider.environment["RESULTS_SQS_ENDPOINT"] = {
    "Fn::ImportValue": "ReportResultsQueueEndpoint"
  };
  provider.environment["LOGS_SQS_ENDPOINT"] = {
    "Fn::ImportValue": "LogsQueueEndpoint"
  };
  provider.environment["EC2_LOGS_SQS_ENDPOINT"] = {
    "Fn::ImportValue": "EC2LogsQueueEndpoint"
  };
  provider.environment["S3_BUCKET"] = {
    "Fn::ImportValue": "ReportOutputs"
  };

  provider.environment["S3_BUCKET"] = { "Fn::ImportValue": "ReportOutputs" };
  var functions = serverless.service.functions;
  for (key in functions) {
    if (!functions[key].environment) {
      functions[key].environment = {};
    }
    functions[key].environment["S3_KEY_PREFIX"] = `${
      serverless.service.service
    }/${key}/`;
    functions[key].environment["S3_REGION"] = 'us-west-2';
    functions[key].environment["S3_BUCKET"] = { "Fn::ImportValue": "ReportOutputs" };
    delete functions[key].events;
    if (functions[key].launchTemplate) {
      functions[key].instanceType = functions[key].instanceType || "m5.large";
      functions[key].workerTimeout = functions[key].workerTimeout || 1; //minute
      functions[key].environment = {
        ...functions[key].environment,
        FUNCTION_ENV_VAR_KEYS: Object.keys(functions[key].environment).join(","),
        WORKER_SH: fs.readFileSync(process.cwd() + "/" + functions[key].worker).toString(),
        WORKER_LAUNCH_TEMPLATE: functions[key].launchTemplate,
        WORKER_TIMEOUT: functions[key].workerTimeout,
        FUNCTION_ID: `${serverless.service.service}-${provider.stage}-${key}`
      }
    }
  }
  // update iamRoleStatements
  if (!provider.iamRoleStatements) {
    provider.iamRoleStatements = [];
  }
  provider.iamRoleStatements.push({
    Effect: "Allow",
    Action: ["sqs:*"],
    Resource: { "Fn::ImportValue": "ReportResultsQueueArn" }
  });
  provider.iamRoleStatements.push({
    Effect: "Allow",
    Action: ["sqs:*"],
    Resource: { "Fn::ImportValue": "ReportsLogQueueArn" }
  });
  provider.iamRoleStatements.push({
    Effect: "Allow",
    Action: ["sqs:*"],
    Resource: { "Fn::ImportValue": "EC2ReportsLogQueueArn" }
  });
  provider.iamRoleStatements.push({
    Effect: "Allow",
    Action: ["ec2:RunInstances"],
    "Resource": ["*"]
  });
  provider.iamRoleStatements.push({
    Effect: "Allow",
    Action: ["ec2:CreateTags"],
    "Resource": ["*"]
  });
  provider.iamRoleStatements.push({
    "Effect":"Allow",
    "Action":"iam:PassRole",
    "Resource": "*"
  })
  // Log forwarding
  if (!serverless.service.custom) {
    serverless.service.custom = {};
  }
  serverless.service.custom.logForwarding = {
    destinationARN: {
      "Fn::ImportValue": "ReportLogsForwarder"
    }
  };
  serverless.service.custom.webpack = {
    webpackConfig: "./webpack.config.js",
    includeModules: true,
    ...serverless.service.custom.webpack
  };
};

class SeaSketchGeoprocessingPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      add_function: {
        usage: "Create a geoprocessing function",
        lifecycleEvents: ["createDirs", "updateYML", "renameSources"],
        options: {
          name: {
            usage: "Name of the function",
            required: true,
            shortcut: "n"
          }
        }
      }
    };

    this.hooks = {
      "add_function:updateYML": updateYML.bind(this, serverless, options),
      "add_function:createDirs": createDirectories.bind(
        this,
        serverless,
        options
      ),
      "add_function:renameSources": renameSources.bind(
        this,
        serverless,
        options
      ),
      "package:initialize": addCommonResources.bind(
        this,
        serverless,
        options
      ),
      "after:deploy:deploy": putMetadataToSQS.bind(this, serverless, options)
    };
  }
}

module.exports = SeaSketchGeoprocessingPlugin;
