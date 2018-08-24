module.exports = {
  plugins: ["@babel/plugin-proposal-class-properties"],
  presets: [
    "@babel/preset-react",
    ["@babel/preset-env", {
      useBuiltIns: "usage",
      targets: {
        browsers: "last 2 versions, ie 11"
      }
    }]
  ]
};
