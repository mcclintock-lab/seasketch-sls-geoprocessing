var wrap = require('async-middleware').wrap
const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: 'us-west-2'});

const PARAMS = {
  Bucket: 'cdn.seasketch.org',
  Key: 'seasketch-sls-api-server.html'
};
const MAX_AGE = 1000 * 30; // 30 seconds

let age = null;
let index = null;

module.exports = wrap( async (req, res) => {
  if (!index || new Date() - age > MAX_AGE) {
    try {
      const data = await s3.getObject({...PARAMS, IfModifiedSince: age}).promise();
      index = data.Body;
      age = new Date();  
    } catch(e) {
      if (e.code === 'NotModified') {
        index = index;
      } else {
        throw e;
      }
    }
  }
  res.set("Content-Type", "text/html");
  res.send(index);
});