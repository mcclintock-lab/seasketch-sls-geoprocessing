const webpack = require("webpack");
const fs = require('fs');
const path = require("path");

const yaml = require("js-yaml");
const ymlpath = path.join(process.cwd(), "/serverless.yml");
const sls = yaml.safeLoad(fs.readFileSync(ymlpath, "utf8"));

const package = require(path.join(process.cwd(), 'package.json'));

const REQUIRED_CLIENT_VERSION = package.dependencies['@seasketch-sls-geoprocessing/client'];
const REQUIRED_PACKAGING_VERSION = package.dependencies['@seasketch-sls-geoprocessing/packaging'];

module.exports = (entry, examples) => {
  const definePlugin = new webpack.DefinePlugin({
    process: {
      env: {
        // expose example and client lists as env vars for studio to use at runtime
        EXAMPLES: `"${examples}"`,
        CLIENTS: `"${entry}"`,
        REQUIRED_CLIENT_VERSION: `"${REQUIRED_CLIENT_VERSION}"`,
        REQUIRED_PACKAGING_VERSION: `"${REQUIRED_PACKAGING_VERSION}"`
      }
    }
  });

  return {
    mode: "production",
    output: {
      filename: "[name]-[hash].js",
      publicPath: "/",
      library: sls ? sls.service : "UNKNOWN",
      libraryTarget: "var"
    },
    resolve: {
      modules: [
        // resolve report implementation modules
        'node_modules', 
        // resolve packaging modules
        `${__dirname}/node_modules`
      ]
    },
    entry: {
      "api-server": `${__dirname}/entries/api-server.js`,
      bundle: `${__dirname}/entries/bundle.js`
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              extends: `${__dirname}/babel.config.js`
            }
          }
        }
      ]
    },
    plugins: [definePlugin],
    externals: {
      react: "React",
      "react-dom": "ReactDOM",
      "@seasketch-sls-geoprocessing/client": "SeaSketchReportClient"
    }
  }
};
