
exports.up = function(knex, Promise) {
  return knex.schema.table('functions', function (table) {
    table.string('launch_template');
    table.string('instance_type');
    table.integer('worker_timeout');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('functions', function (table) {
    table.dropColumn('launch_template');
    table.dropColumn('instance_type');
    table.dropColumn('worker_timeout');
  });
};
