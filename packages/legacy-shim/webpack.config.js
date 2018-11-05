const webpack = require("webpack");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const isDevServer = process.argv[1].indexOf('webpack-dev-server') !== -1;

const CLIENT_VERSION = require('@seasketch-sls-geoprocessing/client/package.json').version
const PACKAGING_VERSION = require('@seasketch-sls-geoprocessing/packaging/package.json').version
const path = require('path');

module.exports = {
  mode: "development" || "production",
  entry: `./index.js`,
  output: {
    filename: isDevServer ? "[name].js" : "[name]-[hash].js",
    publicPath: "/",
    library: "SeaSketchReportingLegacy",
    libraryTarget: "var"
  },
  resolve: {
    modules: [
      './node_modules',
      `${process.cwd()}/node_modules`, 
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      process: {
        env: {
          CLIENT_VERSION: `"${CLIENT_VERSION}"`,
          PACKAGING_VERSION: `"${PACKAGING_VERSION}"`
        }
      }
    })
    // , new BundleAnalyzerPlugin({analyzerMode: 'static'})
  ]
  // externals: {
  //   react: "React",
  //   "react-dom": "ReactDOM",
  //   "@seasketch-sls-geoprocessing/client": "SeaSketchReportClient"
  // }
}
