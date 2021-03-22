module.exports = {
    HOST: process.env.MYSQL_HOST,
    USER: process.env.MYSQL_USER,
    PASSWORD: process.env.MYSQL_PASSWORD,
    DB: process.env.MYSQL_DB,
    dialect: process.env.MYSQL_DIALECT,
    pool: {
      max: parseInt(process.env.MYSQL_POOL_MAX),
      min: parseInt(process.env.MYSQL_POOL_MIN),
      acquire: parseInt(process.env.MYSQL_POOL_ACQUIRE),
      idle: parseInt(process.env.MYSQL_POOL_IDLE),
    },
  };
  