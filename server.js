const express = require('express');
const { Sequelize } = require('sequelize');

const app = express();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS, // make sure this matches your .env
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
);

async function startServer() {
  try {
    console.log('🔄 Connecting to database...');

    await sequelize.authenticate();

    console.log('✅ Database connected successfully');

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ DB connection failed:', error);
    process.exit(1); // force crash so Render shows error
  }
}

// ✅ THIS WAS MISSING
startServer();