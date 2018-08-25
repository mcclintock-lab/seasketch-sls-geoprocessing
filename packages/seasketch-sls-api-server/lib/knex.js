const knexStringcase = require('knex-stringcase');
module.exports = require('knex')(knexStringcase(require('../knexfile.js')));
