module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'ec2-34-236-103-63.compute-1.amazonaws.com',
      database: 'daqeumh31jnctb',
      user: 'ubhokubtfvsmpw',
      password: 'd89683d20445aa236cab39ddd7304ff124fc00e075cd443e457af5510ba9f01e',
      port: 5432,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL, // Heroku provides this
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
