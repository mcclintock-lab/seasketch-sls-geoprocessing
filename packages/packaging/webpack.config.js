const webpack = require("webpack");
// const { babelConfig } = require("@seasketch-sls-geoprocessing/packaging");
const fs = require('fs');
const path = require("path");
const yaml = require("js-yaml");
const ymlpath = path.join(process.cwd(), "/serverless.yml");
var sls = yaml.safeLoad(fs.readFileSync(ymlpath, "utf8"));

module.exports = (entry, examples) => {
  const definePlugin = new webpack.DefinePlugin({
    process: {
      env: {
        // expose example and client lists as env vars for studio to use at runtime
        EXAMPLES: `"${examples}"`,
        CLIENTS: `"${entry}"`
      }
    }
  });

  return {
    mode: "production",
    output: {
      filename: "api-server.js",
      publicPath: "/",
      library: sls.service,
      libraryTarget: "umd"
    },
    resolve: {
      modules: [
        // resolve report implementation modules
        'node_modules', 
        // resolve studio modules
        `${__dirname}/node_modules`
      ]
    },
    entry: [`${__dirname}/entries/api-server.js`],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              // plugins: [`transform-object-rest-spread`],
              extends: `${__dirname}/babel.config.js`
              // babelrc: false,
              // presets: [
              //   [
              //     `${modulesPath}babel-preset-env`,
              //     {
              //       targets: {
              //         browsers: ["last 2 Chrome versions"]
              //       }
              //     }
              //   ],
              //   `${modulesPath}babel-preset-react`,
              //   `${modulesPath}babel-preset-stage-2`
              // ]
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
  };
};
