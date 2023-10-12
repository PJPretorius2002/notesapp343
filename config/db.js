let knexConfig;

if (process.env.DATABASE_URL) {
  // Heroku PostgreSQL configuration
  knexConfig = {
    client: 'pg',
    connection: process.env.DATABASE_URL,
  };
} else {
  // Local PostgreSQL configuration
  knexConfig = require('../knexfile')[process.env.NODE_ENV || 'development'];
}

const knexInstance = require('knex')(knexConfig);

module.exports = knexInstance;
