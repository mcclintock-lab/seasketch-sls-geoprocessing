
exports.up = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.jsonb('clients');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.dropColumn('clients');
  })
};
