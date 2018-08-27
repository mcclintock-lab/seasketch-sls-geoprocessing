const { URL } = require("url");
const HOST = process.env.HOST || "https://localhost:3001";

const asInvocation = (status) => ({
  ...status,
  source: [status.project, "geoprocessing", status.function].join('-'),
  location: new URL(
    `/api/${status.project}/functions/${status.function}/status/${status.uuid}`,
    HOST
  ),
  events: new URL(
    `/api/${status.project}/functions/${status.function}/events/${status.uuid}`,
    HOST
  ),
  payload: new URL(
    `/api/${status.project}/functions/${status.function}/payload/${status.uuid}`,
    HOST
  ),
  function: status.function,
  logPage: new URL(
    `/invocations/detail/${status.uuid}`,
    HOST
  )
});

module.exports = asInvocation;
