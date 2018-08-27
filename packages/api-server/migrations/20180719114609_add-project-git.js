
exports.up = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.string('git');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.dropColumn('git');
  })
};
