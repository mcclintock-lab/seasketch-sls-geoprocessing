
exports.up = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.dateTime('updated_at');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.dropColumn('updated_at');
  })
};
