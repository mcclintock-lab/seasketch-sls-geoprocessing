
exports.up = function(knex, Promise) {
  return knex.schema.table('invocations', function (table) {
    table.string('instance_type');
    table.string('instance_id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('invocations', function (table) {
    table.dropColumn('instance_type');
    table.dropColumn('instance_id');
  });
};
