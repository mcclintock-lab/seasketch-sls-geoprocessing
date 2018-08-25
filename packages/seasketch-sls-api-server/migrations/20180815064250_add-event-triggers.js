// Adds two triggers
// * invocation_status_trigger NOTIFYs 'invocation_status_updated' whenever an invocation is UPDATEd
//   it includes the invocation as a JSON payload
// * new_logs_trigger NOTIFYs 'invocation_log' whenever a new log is INSERTed and includes a JSON
//   payload of the log
exports.up = function(knex, Promise) {
  return knex.schema.raw(`
    CREATE EXTENSION IF NOT EXISTS plv8;
    CREATE OR REPLACE FUNCTION invocation_status_trigger() RETURNS trigger AS
    $$
      if (NEW.status !== OLD.status || NEW.closed !== OLD.closed) {
        plv8.execute("SELECT pg_notify('invocation_status_updated', $1);", [JSON.stringify(NEW)] );
      }
    $$
    LANGUAGE "plv8";

    CREATE TRIGGER invocation_status_trigger
        AFTER UPDATE
        ON invocations FOR EACH ROW
        EXECUTE PROCEDURE invocation_status_trigger();

    CREATE OR REPLACE FUNCTION new_logs_trigger() RETURNS trigger AS
    $$
      plv8.execute("SELECT pg_notify('invocation_log', $1);", [JSON.stringify(NEW)] );
    $$
    LANGUAGE "plv8";

    CREATE TRIGGER new_logs_trigger
        AFTER INSERT
        ON logs FOR EACH ROW
        EXECUTE PROCEDURE new_logs_trigger();
  `)  
};

exports.down = function(knex, Promise) {
  return knex.schema.raw(`
    DROP FUNCTION invocation_status_trigger CASCADE;
    DROP FUNCTION new_logs_trigger CASCADE;
  `)
};
