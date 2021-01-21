const HtmlWebPackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    "mini-react": "./src/index.js",
    app: "./app/index.js",
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "js/[name].min.js",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  // optimization: {
  //   splitChunks: {
  //     chunks: "all",
  //     minSize: 0,
  //     minChunks: 1,
  //     maxAsyncRequests: 5,
  //     maxInitialRequests: 3,
  //     automaticNameDelimiter: "-",
  //     name: true,
  //     cacheGroups: {
  //       vendors: {
  //         test: /[\\/]node_modules[\\/]/,
  //         priority: -10,
  //         name: "vendors",
  //       },
  //       "mini-react": {
  //         test: /[\\/]src[\\/]/,
  //         priority: -20,
  //         name: "mini-react",
  //       },
  //     },
  //   },
  //   runtimeChunk: "single",
  // },
  resolve: {
    alias: {
      "mini-react": path.resolve(__dirname, "src"),
    },
    extensions: [".js", ".jsx"],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebPackPlugin({
      template: "./app/index.html",
      filename: "index.html",
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  mode: 'development',
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, "./dist"),
    compress: true,
    open: true,
    port: 8080,
    host: "localhost",
    hot: true,
  },
};
