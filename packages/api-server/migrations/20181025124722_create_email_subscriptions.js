exports.up = function(knex, Promise) {
  return knex.schema.createTable('email_subscriptions', function (table) {
    table.uuid('invocation_id').references("invocations.uuid");
    table.string('email').notNullable();
    table.string('url').notNullable();
    table.string('report_name').notNullable();
    table.bool('locked').default(false);
    table.unique(['invocation_id', 'email']);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('email_subscriptions');
};
