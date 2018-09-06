const webpack = require('webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require("path");
const CLIENT_VERSION = require('@seasketch-sls-geoprocessing/client/package.json').version
const PACKAGING_VERSION = require('@seasketch-sls-geoprocessing/packaging/package.json').version

module.exports = {
  mode: "production" || process.env.NODE_ENV || "development",
  devtool: true || process.env.NODE_ENV === 'production' ? false : "eval-source-map",
  entry: true || process.env.NODE_ENV === 'production' ? ['babel-polyfill', './client/index.js'] : [
    'babel-polyfill',
    'react-hot-loader/patch',
    "./client/index.js"
  ],

  module: {
    rules: [
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: require.resolve('react'),
        use: [{
          loader: 'expose-loader',
          options: 'React'
        }]
      },
      {
        test: require.resolve('react-dom'),
        use: [{
          loader: 'expose-loader',
          options: 'ReactDOM'
        }]
      },
      {
        test: require.resolve('@seasketch-sls-geoprocessing/client'),
        use: [{
          loader: 'expose-loader',
          options: 'SeaSketchReportClient'
        }]
      }
    ],
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"],
    modules: [
      // resolve report implementation modules
      'node_modules', 
      `${__dirname}/node_modules`,
      `${process.cwd()}/node_modules`
    ]
  },
  output: {
    path: __dirname + "/dist",
    publicPath: process.env.NODE_ENV === 'production' ? "https://cdn.seasketch.org/" : "/",
    filename: '[name].[hash].js'
  },
  plugins: process.env.NODE_ENV === 'production' ? [
    new HtmlWebpackPlugin({
      template: "./index.html",
      favicon: "./favicon.ico"
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // , new BundleAnalyzerPlugin()
    new webpack.DefinePlugin({
      process: {
        env: {
          CLIENT_VERSION: `"${CLIENT_VERSION}"`,
          PACKAGING_VERSION: `"${PACKAGING_VERSION}"`
        }
      }
    })
  ] : [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: "./index.html"
    }),
    new webpack.DefinePlugin({
      process: {
        env: {
          CLIENT_VERSION: `"${CLIENT_VERSION}"`,
          PACKAGING_VERSION: `"${PACKAGING_VERSION}"`
        }
      }
    })  
  ],
  devServer: {
    contentBase: "./dist",
    port: 3001,
    proxy: {
      "/api": "http://localhost:3000"
    },
    historyApiFallback: {
      rewrites: [{ from: /$!api\//, to: "/index.html" }]
    },
    hot: true
  }
};
