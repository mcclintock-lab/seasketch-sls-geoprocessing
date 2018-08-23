const webpack = require('webpack');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const ymlpath = path.join(process.cwd(), '/serverless.yml');
var sls = yaml.safeLoad(fs.readFileSync(ymlpath, 'utf8'));

let modulesPath = `${__dirname}/../../`;
if (!fs.existsSync(`${modulesPath}babel-preset-env`)) {
  console.log("babel-preset-env not found. working from linked seasketch-report-client?");
  modulesPath = `${__dirname}/../node_modules/`;
}


const mod = (env) => {
  return {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!seasketch-report-client)/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: env !== 'production' ? [
              `transform-object-rest-spread`,
              `react-hot-loader/babel`] : [`transform-object-rest-spread`],
            babelrc: false,
            presets: [
              [
                `${modulesPath}babel-preset-env`,
                {
                  "targets": {
                    "browsers": ["last 2 Chrome versions"]
                  }
                }
              ],
              `${modulesPath}babel-preset-react`,
              `${modulesPath}babel-preset-stage-2`
            ]
          }
        }
      }
    ]
  }
}

module.exports = (entry, examples) => {

  const htmlPlugin = new HtmlWebPackPlugin({
    template: `${__dirname}/index.html`,
    filename: "./index.html"
  });

  const definePlugin = new webpack.DefinePlugin({
    process: {
      env: {
        EXAMPLES: `"${examples}"`,
        CLIENTS: `"${entry}"`
      }
    }
  });

  return [
    // local studio environment
    {
      mode: "development",
      devtool: "eval-source-map",
      resolve: {
        modules: ['node_modules', '../../node_modules']
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
      module: mod('development'),
      plugins: [
        htmlPlugin,
        definePlugin,
        new webpack.HotModuleReplacementPlugin()
      ]
    },
    {
      mode: "production",
      // devtool: "eval-source-map",
      output: {
        filename: "api-server-bundle.js",
        publicPath: "/",
        library: sls.service,
        libraryTarget: 'umd'
      },
      entry: [
        `${__dirname}/../studio/api-server-index.js`
      ],
      module: mod('production'),
      plugins: [
        definePlugin
      ],
      externals: {
        'react': 'React',
        'react-dom': 'ReactDOM',
        'seasketch-report-client': 'SeaSketchReportClient'
      }
    }
  ];
}
