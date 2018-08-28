import {v4 as uuid} from 'uuid';

const c = require(process.env.CLIENTS);
const clients = Object.keys(c).reduce((arr, k) => {
  arr.push({
    name: k,
    tabs: c[k] 
  })
  return arr;
}, []);

export {clients};