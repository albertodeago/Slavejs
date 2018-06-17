const path = require("path")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const CleanWebpackPlugin = require("clean-webpack-plugin")
const webpack = require("webpack")

module.exports = (env, options) => {
  const isProductionMode = (options.mode === "production") ? true : false
  
  const src = path.resolve("./src")
  const dest = path.resolve("./dist")

  let webpackConfig = {
    entry: {
      app: [
        "babel-polyfill",
        src + "/index.js"
      ]
    },
    output: {
      library: "Slave",
      libraryTarget: "umd",
      filename: "Slave.js",
      libraryExport: "default"
    },
    devServer: {
      host: "127.0.0.1",
      open: true,
      hot: true
    },
    plugins: [
      new CleanWebpackPlugin([dest]),
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              babelrc: false
            }
          }
        }
      ]
    },
    optimization: {
      minimize: isProductionMode,
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true
        })
      ]
    }
  }

  return webpackConfig
}
