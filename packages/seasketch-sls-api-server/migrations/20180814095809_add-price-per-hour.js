
exports.up = function(knex, Promise) {
  return knex.schema.table('functions', function (table) {
    table.float('price_per_hour');
  }).table("invocations", (table) => {
    table.float('price_per_hour');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('functions', function (table) {
    table.dropColumn("price_per_hour");
  }).table('invocations', (table) => {
    table.dropColumn("price_per_hour");
  })
};
