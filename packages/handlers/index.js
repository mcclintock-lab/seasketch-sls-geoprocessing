const asHandler = require("./src/handler");
module.exports = {
  asHandler: asHandler,
  amiHandler: asHandler(require("./src/amiHandler"))
};
