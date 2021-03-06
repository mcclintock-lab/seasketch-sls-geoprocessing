import {v4 as uuid} from 'uuid';

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

const context = require.context(process.env.EXAMPLES, true, /^\.\/.*\.json$/);
const examples = context.keys().reduce((arr, k) => {
  const feature = context(k);
  feature.properties = feature.properties || {};
  feature.properties.id = feature.properties.id || uuid();
  arr.push({
    name: k.split('/').pop(),
    feature: feature
  });
  return arr;
}, []);


export {clients, examples};