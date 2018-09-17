const mongoose = require("mongoose");
if (process.env.SEASKETCH_DB) {
  console.log("connecting to seasketch db", process.env.SEASKETCH_DB);
  mongoose.connect(process.env.SEASKETCH_DB);
}

module.exports = mongoose;