const fs = require('fs');
// Adds two triggers
// * invocation_status_trigger NOTIFYs 'invocation_status_updated' whenever an invocation is UPDATEd
//   it includes the invocation as a JSON payload
// * new_logs_trigger NOTIFYs 'invocation_log' whenever a new log is INSERTed and includes a JSON
//   payload of the log
exports.up = function(knex, Promise) {
  return knex.schema
    .table("functions", table => {
      table.integer("invocations").defaultTo(0);
      table.integer("average_memory_use").defaultTo(0);
      table.integer("billed_duration_50th_percentile").defaultTo(0);
      table.integer("duration_50th_percentile").defaultTo(0);
      table.decimal("cost_per_invocation", null).defaultTo(0);
      table.integer("invocations_this_month").defaultTo(0);
      table.integer("budget_spent_percent").defaultTo(0);
    })
    .then(() => {
      return knex.schema.raw(fs.readFileSync(`${__dirname}/cost_metadata.sql`).toString());
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.raw(`
  `).then(() => {
    return knex.schema.table('functions', function (table) {
      table.dropColumn('invocations');
      table.dropColumn('average_memory_use');
      table.dropColumn('billed_duration_50th_percentile');
      table.dropColumn('duration_50th_percentile');
      table.dropColumn('cost_per_invocation');
      table.dropColumn('invocations_this_month');
      table.dropColumn('budget_spent_percent');
    });  
  })
};
