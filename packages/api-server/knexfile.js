// Update with your config settings.
require('dotenv').config()

module.exports = {
  client: 'pg',
  connection: process.env.DB_CONNECTION_STRING,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
};
