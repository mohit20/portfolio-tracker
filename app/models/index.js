const dbConfig = require("../config/mySql.config.js");
const mongodbConfig = require("../config/mongo.config.js");
const mongoose = require("mongoose");
const Sequelize = require("sequelize");

mongoose.connect(mongodbConfig.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.trades = require("./mySql/trades")(sequelize, Sequelize);

module.exports = db;
