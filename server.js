const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    app.listen(process.env.PORT || 3000, () => {
      console.log('🚀 Server running');
    });
  } catch (error) {
    console.error('❌ DB connection failed:', error);
  }
}