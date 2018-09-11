exports.up = function(knex, Promise) {
  return knex.schema.raw(`
    CREATE OR REPLACE FUNCTION invocation_status_trigger() RETURNS trigger AS
    $$
      if (NEW.status !== OLD.status || NEW.closed !== OLD.closed) {
        plv8.execute("SELECT pg_notify('invocation_status_updated', $1);", [JSON.stringify({uuid: NEW.uuid, status: NEW.status})] );
      }
    $$
    LANGUAGE "plv8";
  `)
};

exports.down = function(knex, Promise) {
  return knex.schema.raw(`
    DROP FUNCTION invocation_status_trigger CASCADE;
  `)
};
