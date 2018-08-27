
exports.up = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.integer('bundle_size');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('projects', (table) => {
    table.dropColumn('bundle_size');
  })
};
