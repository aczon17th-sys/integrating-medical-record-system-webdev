const mysql = require('mysql2/promise');
require('dotenv').config();
const { getMysqlSslOptions } = require('../../config/mysqlSsl');

const ssl = getMysqlSslOptions();

const pool = mysql.createPool(
  process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        ssl,
        waitForConnections: true,
        connectionLimit: 10
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'medical_record_system',
        ssl,
        waitForConnections: true,
        connectionLimit: 10
      }
);

module.exports = pool;
