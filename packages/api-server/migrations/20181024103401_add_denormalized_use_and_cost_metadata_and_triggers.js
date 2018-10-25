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
      return knex.schema.raw(`
    CREATE OR REPLACE FUNCTION invocation_status_function_stats_trigger() RETURNS trigger AS
    $$
    if (NEW.status === "complete" && NEW.closed) {
      var COST_PER_GB_SECOND = 0.00001667;
      var APPROX_SQS_COST =
        0.0000004 * // per message
        (1 + // results message
          3); // log messages
      var COST_PER_REQUEST = 0.0000002;
      function lambdaCost(memorySize, billedDuration) {
        return (
          COST_PER_GB_SECOND * (memorySize / 1000) * (billedDuration / 1000) +
          COST_PER_REQUEST +
          APPROX_SQS_COST
        );
      }
    
      function ec2Cost(pricePerHour, duration) {
        // Even with per-second billing, ec2 sets a min of 60 seconds
        if (duration < 60000) {
          duration = 60000;
        }
        let minutes = duration / 1000 / 60;
        return (pricePerHour / 60) * minutes;
      }
    
      function calculateCost(
        launchTemplate,
        pricePerHour,
        duration50thPercentile,
        memorySize,
        billedDuration50thPercentile
      ) {
        if (launchTemplate) {
          return ec2Cost(pricePerHour, duration50thPercentile);
        } else {
          return lambdaCost(memorySize, billedDuration50thPercentile);
        }
      }
      var func = plv8.execute(\`SELECT * from functions where function_name = '\${[
        NEW.project,
        "geoprocessing",
        NEW.function
      ].join("-")}'\`)[0];
    
      var rows = plv8.execute(\`SELECT 
                count(function) as invocations, 
                avg(max_memory_used_mb) as average_memory_use,  
                percentile_cont(0.5) within group (order by billed_duration_ms) as billed_duration_50th_percentile, 
                percentile_cont(0.5) within group (order by duration) as duration_50th_percentile 
                FROM invocations 
                WHERE project = '\${NEW.project}' and function = '\${
        NEW.function
      }'
              \`);
      var stats = plv8.execute(\`
                SELECT count(function) as invocations from invocations
                WHERE date_trunc('month', requested_at) = date_trunc('month', current_date)
                AND status != 'failed'
                AND project = '\${NEW.project}'
                AND function = '\${NEW.function}'
              \`);
      var costPerInvocation = calculateCost(
        func.launch_template,
        func.price_per_hour,
        rows[0].duration_50th_percentile,
        func.memory_size,
        rows[0].billed_duration_50th_percentile
      );
      var budgetSpentPercent = Math.round(
        (costPerInvocation / func.cost_limit_usd) * 100
      );
      var updated = plv8.execute(\`UPDATE functions
                SET invocations = \${rows[0].invocations},
                average_memory_use = \${rows[0].average_memory_use},
                billed_duration_50th_percentile = \${
                  rows[0].billed_duration_50th_percentile
                },
                duration_50th_percentile = \${rows[0].duration_50th_percentile},
                cost_per_invocation = \${costPerInvocation},
                invocations_this_month = \${stats[0].invocations},
                budget_spent_percent = \${budgetSpentPercent}
                where project_name = '\${NEW.project}' and name = '\${
        NEW.function
      }'
              \`);
    }
    $$
    LANGUAGE "plv8";
    
    DROP TRIGGER IF EXISTS invocation_status_function_stats_trigger on invocations;
    CREATE TRIGGER invocation_status_function_stats_trigger
        AFTER UPDATE
        ON invocations FOR EACH ROW
        EXECUTE PROCEDURE invocation_status_function_stats_trigger();
        `);
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
