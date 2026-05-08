const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [[patientCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'patient'");
    const [[appointmentCount]] = await pool.query('SELECT COUNT(*) AS total FROM appointments');
    const [[billingCount]] = await pool.query("SELECT COUNT(*) AS total FROM billings WHERE status = 'unpaid'");
    const [[recordCount]] = await pool.query('SELECT COUNT(*) AS total FROM medical_records');

    res.render('dashboard', {
      title: 'Dashboard',
      stats: {
        patients: patientCount.total,
        appointments: appointmentCount.total,
        unpaidBills: billingCount.total,
        records: recordCount.total
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
