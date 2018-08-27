
exports.up = function(knex, Promise) {
  return knex.schema.createTable('invocations', function(table) {
    table.uuid('uuid').primary()
    table.string('project').notNullable()
    table.string('function').notNullable()
    table.dateTime('requested_at').notNullable()
    table.dateTime('delivered_at')
    table.string('request_id')
    table.index('request_id')
    table.dateTime('eta')
    table.integer('duration')
    table.integer('billed_duration_ms')
    table.integer('memory_size_mb')
    table.integer('max_memory_used_mb')
    table.integer('payload_size_bytes').notNullable()
    table.json('results')
    table.string('sketch_id')
    table.index('sketch_id')
    table.enum('status', ['requested', 'running', 'complete', 'failed', 'worker-booting', 'worker-running'])
  }).createTable('payloads', function(table) {
    table.uuid('invocation_uuid').unique().references('invocations.uuid')
    table.json('payload')
  }).createTable('logs', function(table) {
    table.string('id').primary()
    table.string('request_id').notNullable()
    table.index('request_id')
    table.dateTime('timestamp').notNullable()
    table.text('message').notNullable()
  }).createTable('projects', function(table) {
    table.string('name').primary()
    table.string('region').notNullable()
    table.json('center')
    table.integer('zoom')
    table.string('project')
  }).createTable('functions', function(table) {
    table.string('project_name').references('projects_name')
    table.string('function_name').primary()
    table.string('name').notNullable()
    table.string('description')
    table.integer('timeout').notNullable()
    table.integer('memory_size').notNullable()
    table.string('outputs').notNullable()
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('logs')
    .dropTable('payloads')
    .dropTable('invocations')
    .dropTable('functions')
    .dropTable('projects')
};
