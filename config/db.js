let knexConfig;

if (process.env.DATABASE_URL) {
  // Heroku PostgreSQL configuration
  knexConfig = {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Add this to handle SSL correctly
    },
  };
} else {
  // Local PostgreSQL configuration
  knexConfig = require('../knexfile')[process.env.NODE_ENV || 'development'];
}

const knexInstance = require('knex')(knexConfig);

module.exports = knexInstance;
