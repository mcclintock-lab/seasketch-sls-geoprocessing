
exports.up = function(knex, Promise) {
  return knex.schema.table('invocations', (table) => {
    table.bool('closed');
  }).table('logs', (table) => {
    table.bool('last').default(false)
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('invocations', (table) => {
    table.dropColumn('closed');
  }).table('logs', (table) => {
    table.dropColumn('last');
  })
};
