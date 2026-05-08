const { Sequelize } = require("sequelize");
require("dotenv").config();

const commonOptions = {
  dialect: "mysql",
  logging: false
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
        port: process.env.DB_PORT || 3306
      }
    );

module.exports = sequelize;
