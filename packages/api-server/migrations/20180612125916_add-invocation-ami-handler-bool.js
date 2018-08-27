
exports.up = function(knex, Promise) {
  return knex.schema.table('invocations', function (table) {
    table.boolean('ami_handler').default(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('invocations', function (table) {
    table.dropColumn('ami_handler');
  });
};
