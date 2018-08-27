
exports.up = function(knex, Promise) {
  return knex.schema.table('logs', function (table) {
    table.enum('type', ["info", "stdout", "stderr", "command"]).notNullable().default('info');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('logs', function (table) {
    table.dropColumn("type")
  });
};
