
exports.up = function(knex, Promise) {
  return knex.schema.createTable('last_cost_reset', (table) => {
    table.dateTime('at', knex.fn.now());
  }).then(() => {
    knex.schema.table('last_cost_reset', () => {
      table.insert({at: new Date()});
    });
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('last_cost_reset');
};
