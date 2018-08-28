const webpack = require("webpack");
const fs = require('fs');
const path = require("path");
var sls = null;
try {
  const yaml = require("js-yaml");
  const ymlpath = path.join(process.cwd(), "/serverless.yml");
  sls = yaml.safeLoad(fs.readFileSync(ymlpath, "utf8"));
} catch (e) {
  // probably building shim, ignore
}

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

  return [
    {
      mode: "production",
      output: {
        filename: "[name].js",
        publicPath: "/",
        library: sls ? sls.service : "UNKNOWN",
        libraryTarget: "umd"
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
    },
    // seasketch.org legacy support
    {
      mode: "production",
      entry: `${__dirname}/entries/legacy.js`,
      output: {
        filename: "[name]-[hash].js",
        publicPath: "/",
        library: "SeaSketchReportingLegacy",
        libraryTarget: "var"
      },
      // resolve: {
      //   modules: [
      //     // resolve report implementation modules
      //     'node_modules', 
      //     // resolve packaging modules
      //     `${__dirname}/node_modules`
      //   ]
      // },
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
      plugins: [],
      // externals: {
      //   react: "React",
      //   "react-dom": "ReactDOM",
      //   "@seasketch-sls-geoprocessing/client": "SeaSketchReportClient"
      // }
    }
  ];
};
