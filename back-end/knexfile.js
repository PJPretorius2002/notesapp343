// knexfile.js
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'Password',
      database: 'notesapp',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',  // Create this directory
    },
    seeds: {
      directory: './seeds',  // Create this directory
    },
  },
};

