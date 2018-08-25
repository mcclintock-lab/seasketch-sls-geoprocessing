import {v4 as uuid} from 'uuid';
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

export default examples;