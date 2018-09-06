const webpack = require("webpack");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { babel } = require("@seasketch-sls-geoprocessing/packaging");
const path = require("path");
const CLIENT_VERSION = require('@seasketch-sls-geoprocessing/client/package.json').version
const PACKAGING_VERSION = require('@seasketch-sls-geoprocessing/packaging/package.json').version
const package = require(path.join(process.cwd(), 'package.json'));
const REQUIRED_CLIENT_VERSION = package.dependencies['@seasketch-sls-geoprocessing/client'];
const REQUIRED_PACKAGING_VERSION = package.dependencies['@seasketch-sls-geoprocessing/packaging'];

babel.plugins.push(
  path.resolve(
    require.resolve("react-hot-loader").replace("/index.js", ""),
    "babel"
  )
);

module.exports = (entry, examples) => {
  const htmlPlugin = new HtmlWebPackPlugin({
    template: `${__dirname}/index.html`,
    filename: "./index.html"
  });

  const definePlugin = new webpack.DefinePlugin({
    process: {
      env: {
        // expose example and client lists as env vars for studio to use at runtime
        EXAMPLES: `"${examples}"`,
        CLIENTS: `"${entry}"`,
        CLIENT_VERSION: `"${CLIENT_VERSION}"`,
        PACKAGING_VERSION: `"${PACKAGING_VERSION}"`,
        REQUIRED_CLIENT_VERSION: `"${REQUIRED_CLIENT_VERSION}"`,
        REQUIRED_PACKAGING_VERSION: `"${REQUIRED_PACKAGING_VERSION}"`
      }
    }
  });

  return {
    mode: "development",
    devtool: "eval",
    devServer: {
      hot: true,
      inline: true
    },
    resolve: {
      modules: [
        // resolve report implementation modules
        path.join(process.cwd(), 'node_modules'),
        'node_modules',
        // resolve studio modules
        `${__dirname}/node_modules`
      ],
      alias: {
        "babel-core": path.resolve(
          path.join(process.cwd(), "./node_modules/@babel/core")
        )
      }
    },
    output: {
      filename: "studio.js",
      publicPath: "/"
    },
    entry: [
      "webpack-dev-server/client?http://localhost:3009",
      "webpack/hot/dev-server",
      `${__dirname}/../studio/index.js`
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!@seasketch-sls-geoprocessing\/studio)/,
          use: {
            loader: `babel-loader`,
            options: babel
          }
        }
      ]
    },
    plugins: [
      htmlPlugin,
      definePlugin,
      new webpack.HotModuleReplacementPlugin()
    ]
  };
};
