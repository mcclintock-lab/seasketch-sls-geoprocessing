DROP INDEX IF EXISTS invocations_project_function; 
CREATE INDEX invocations_project_function ON invocations using btree(project, function);

CREATE OR REPLACE FUNCTION update_function_cost_metadata(IN project VARCHAR(255), function_name VARCHAR(255)) RETURNS void AS
$$
  const COST_PER_GB_SECOND = 0.00001667;
  const APPROX_SQS_COST =
    0.0000004 * // per message
    (1 + // results message
      3); // log messages
  const COST_PER_REQUEST = 0.0000002;
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

  var func = plv8.execute(`SELECT * from functions where function_name = '${[project, 'geoprocessing', function_name].join('-')}'`)[0];

  var rows = plv8.execute(`SELECT 
            count(function) as invocations, 
            avg(max_memory_used_mb) as average_memory_use,  
            percentile_cont(0.5) within group (order by billed_duration_ms) as billed_duration_50th_percentile, 
            percentile_cont(0.5) within group (order by duration) as duration_50th_percentile 
            FROM invocations 
            WHERE project = '${project}' and function = '${function_name}'
          `);
  var stats = plv8.execute(`
            SELECT count(function) as invocations from invocations
            WHERE date_trunc('month', requested_at) = date_trunc('month', current_date)
            AND status != 'failed'
            AND project = '${project}'
            AND function = '${function_name}'
          `);
  var costPerInvocation = calculateCost(
    func.launch_template,
    func.price_per_hour,
    rows[0].duration_50th_percentile,
    func.memory_size,
    rows[0].billed_duration_50th_percentile
  );
  var budgetSpentPercent = Math.round(
    (costPerInvocation * stats[0].invocations / func.cost_limit_usd) * 100
  );

  var updated = plv8.execute(`UPDATE functions
            SET invocations = ${rows[0].invocations},
            average_memory_use = ${rows[0].average_memory_use},
            billed_duration_50th_percentile = ${rows[0].billed_duration_50th_percentile},
            duration_50th_percentile = ${rows[0].duration_50th_percentile},
            cost_per_invocation = ${costPerInvocation},
            invocations_this_month = ${stats[0].invocations},
            budget_spent_percent = ${budgetSpentPercent}
            where project_name = '${project}' and name = '${function_name}'
          `);
$$
LANGUAGE "plv8";

CREATE OR REPLACE FUNCTION update_function_cost_metadata_trigger() RETURNS trigger AS $$
  if (NEW.status !== "failed") {
    plv8.execute(`select update_function_cost_metadata('${NEW.project}', '${NEW.function}')`);
  }
$$
LANGUAGE "plv8";

DROP TRIGGER IF EXISTS update_function_cost_metadata_trigger on invocations;

CREATE TRIGGER update_function_cost_metadata_trigger
    AFTER UPDATE OR INSERT
    ON invocations FOR EACH ROW
    EXECUTE PROCEDURE update_function_cost_metadata_trigger();


CREATE OR REPLACE FUNCTION reset_function_cost_metadata() RETURNS trigger AS $$
  const functions = plv8.execute(`SELECT * from functions`);
  for (var func of functions) {
    plv8.execute(`select update_function_cost_metadata('${func.project_name}', '${func.name}')`);
  }
$$
LANGUAGE "plv8";
