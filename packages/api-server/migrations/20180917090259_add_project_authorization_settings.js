
exports.up = function(knex, Promise) {
  return knex.schema.table('projects', function (table) {
    table.boolean('require_auth').default(false);
    table.specificType('authorized_clients', 'text[]');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('projects', function (table) {
    table.dropColumn("require_auth");
    table.dropColumn("authorized_clients");
    table.string('project');
  });
};
