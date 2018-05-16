module.exports = require("./src/plugin");
const asHandler = require("./src/handler");
module.exports.asHandler = asHandler;
module.exports.amiHandler = asHandler(require("./src/amiHandler"));
