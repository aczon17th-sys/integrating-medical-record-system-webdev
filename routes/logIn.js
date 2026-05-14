require('dotenv').config();

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

/* =========================
   DATABASE CONNECTION
========================= */

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
    },
    logging: false
  }
);

/* =========================
   USER MODEL
========================= */

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'users'
});

/* =========================
   REGISTER ROUTE
========================= */

app.post('/register', async (req, res) => {

  try {

    const { username, password } = req.body;

    // Check if empty
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    await User.create({
      username,
      password: hashedPassword
    });

    res.json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });

  }

});

/* =========================
   LOGIN ROUTE
========================= */

app.post('/login', async (req, res) => {

  try {

    const { username, password } = req.body;

    // Check empty fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    // Find user
    const user = await User.findOne({
      where: { username }
    });

    // User not found
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });

  }

});

/* =========================
   TEST ROUTE
========================= */

app.get('/', (req, res) => {
  res.send('Server is running');
});

/* =========================
   START SERVER
========================= */

async function startServer() {

  try {

    console.log('🔄 Connecting to database...');

    await sequelize.authenticate();

    console.log('✅ Database connected successfully');

    // Create table automatically
    await sequelize.sync();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {

    console.error('❌ DB connection failed:', error);

    process.exit(1);

  }

}

startServer();