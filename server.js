require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const sequelize = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const { seedDefaultUsers } = require('./seedDefaultUsers');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const billingRoutes = require('./routes/billingRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);
app.use('/api/medical-records', authMiddleware, medicalRecordRoutes);
app.use('/api/billings', authMiddleware, billingRoutes);
app.use('/api/users', authMiddleware, userRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

async function startServer() {
  try {
    console.log('Connecting to database...');

    await sequelize.authenticate();

    console.log('Database connected successfully');

    await sequelize.sync({ alter: true });
    await seedDefaultUsers();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('DB connection failed:', error);
    process.exit(1);
  }
}

startServer();
