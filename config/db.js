const { Sequelize } = require("sequelize");
require("./env");
const { getMysqlSslOptions } = require("./mysqlSsl");

const ssl = getMysqlSslOptions();

const commonOptions = {
  dialect: "mysql",
  logging: false,
  dialectOptions: ssl ? { ssl } : undefined
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...commonOptions,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306)
      }
    );

module.exports = sequelize;
