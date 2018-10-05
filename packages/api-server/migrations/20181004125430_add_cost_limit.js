
exports.up = function(knex) {
  return knex.schema.table('functions', function (table) {
    table.integer('cost_limit_usd').defaultTo(5);
  });
};

exports.down = function(knex) {
  return knex.schema.table('functions', function (table) {
    table.dropColumn('cost_limit_usd');
  });
};
