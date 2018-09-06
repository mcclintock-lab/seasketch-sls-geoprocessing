const requiredClientVersion = process.env.REQUIRED_CLIENT_VERSION;
const requiredPackagingVersion = process.env.REQUIRED_PACKAGING_VERSION;

const c = require(process.env.CLIENTS);
const clients = Object.keys(c).reduce((arr, k) => {
  arr.push({
    name: k,
    tabs: c[k],
    requiredClientVersion,
    requiredPackagingVersion 
  })
  return arr;
}, []);

export default clients;