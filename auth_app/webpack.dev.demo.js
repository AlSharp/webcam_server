const {merge} = require('webpack-merge');
const common = require('./webpack.common');
const path = require("path");
const DefinePlugin = require("webpack").DefinePlugin;

module.exports = (env, argv) => {
  return merge(common, {
    mode: "development",
    devServer: {
      contentBase: path.join(__dirname, "dist"),
      host: '0.0.0.0',
      disableHostCheck: true
    },
    output: {
      publicPath: "/"
    },
    plugins: [
      new DefinePlugin({
        PRODUCTION: false,
        DEMO: true
      })
    ]
  })
};