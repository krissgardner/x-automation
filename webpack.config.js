const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const WebpackObfuscator = require("webpack-obfuscator");

module.exports = {
  entry: "./src/index.ts",
  target: "node",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },
  plugins: [
    new WebpackObfuscator({
      rotateStringArray: true,
    }),
    new CopyPlugin({
      patterns: [{ from: "storage.example.json", to: "./storage.json" }],
    }),
  ],
};
