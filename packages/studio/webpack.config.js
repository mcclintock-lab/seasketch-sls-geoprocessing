const webpack = require('webpack');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { babel } = require("@seasketch-sls-geoprocessing/packaging");
const path = require('path');

babel.plugins.push(
  path.resolve(require.resolve("react-hot-loader").replace("/index.js", ""), 'babel')
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
        CLIENTS: `"${entry}"`
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
          'node_modules', 
          // resolve studio modules
          `${__dirname}/node_modules`
        ],
        alias: {
          react: path.resolve(path.join(__dirname, './node_modules/react')),
          'babel-core': path.resolve(
            path.join(__dirname, './node_modules/@babel/core'),
          )
        },
      },
      output: {
        filename: "studio.js",
        publicPath: "/"
      },
      entry: [
        'webpack-dev-server/client?http://localhost:3009',
        'webpack/hot/dev-server',
        `${__dirname}/../studio/index.js`
      ],
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
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
  }
    // {
    //   mode: "production",
    //   // devtool: "eval-source-map",
    //   output: {
    //     filename: "api-server-bundle.js",
    //     publicPath: "/",
    //     library: sls.service,
    //     libraryTarget: 'umd'
    //   },
    //   entry: [
    //     `${__dirname}/../studio/api-server-index.js`
    //   ],
    //   module: mod('production'),
    //   plugins: [
    //     definePlugin
    //   ],
    //   externals: {
    //     'react': 'React',
    //     'react-dom': 'ReactDOM',
    //     'seasketch-report-client': 'SeaSketchReportClient'
    //   }
    // }
//   ];
// }
