const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const ncp = require("ncp").ncp;
const YAWN = require("yawn-yaml/cjs");
const YML_TEMPLATE = `${__dirname}/../function_config.yml`;
const FUNCTION_TEMPLATE = `${__dirname}/../function_template`;

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
  return await fs.writeFile("./serverless.yml", yawn.yaml);
};

const addCommonResources = (serverless, options) => {
  var provider = serverless.service.provider;
  // update environment
  if (!provider.environment) {
    provider.environment = {};
  }
  provider.environment["RESULTS_SQS_ENDPOINT"] = {
    "Fn::ImportValue": "ReportResultsQueueEndpoint"
  };
  provider.environment["S3_BUCKET"] = { "Fn::ImportValue": "ReportOutputs" };
  // update iamRoleStatements
  if (!provider.iamRoleStatements) {
    provider.iamRoleStatements = [];
  }
  provider.iamRoleStatements.push({
    Effect: "Allow",
    Action: ["sqs:*"],
    Resource: { "Fn::ImportValue": "ReportResultsQueueArn" }
  });
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
    webpackConfig: './webpack.config.js',
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
        lifecycleEvents: ["createDirs", "updateYML"],
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
      "before:package:initialize": addCommonResources.bind(
        this,
        serverless,
        options
      )
    };
  }
}

module.exports = SeaSketchGeoprocessingPlugin;
