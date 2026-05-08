const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('patient'));

router.get('/appointments', async (req, res, next) => {
  try {
    const [appointments] = await pool.query(
      `SELECT a.*, d.first_name AS doctor_first, d.last_name AS doctor_last
       FROM appointments a
       LEFT JOIN users d ON d.id = a.doctor_id
       WHERE a.patient_id = ?
       ORDER BY a.scheduled_at DESC`,
      [req.session.user.id]
    );
    const [doctors] = await pool.query("SELECT id, first_name, last_name FROM users WHERE role = 'doctor' ORDER BY last_name");
    res.render('patient/appointments', { title: 'My Appointments', appointments, doctors });
  } catch (error) {
    next(error);
  }
});

router.post('/appointments', async (req, res, next) => {
  try {
    const { doctor_id, scheduled_at, reason } = req.body;
    await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
       VALUES (?, ?, ?, ?, 'requested', ?)`,
      [req.session.user.id, doctor_id || null, scheduled_at, reason, req.session.user.id]
    );

    req.session.notice = { type: 'success', message: 'Appointment request submitted.' };
    res.redirect('/patient/appointments');
  } catch (error) {
    next(error);
  }
});

router.get('/billings', async (req, res, next) => {
  try {
    const [billings] = await pool.query('SELECT * FROM billings WHERE patient_id = ? ORDER BY created_at DESC', [
      req.session.user.id
    ]);
    res.render('patient/billings', { title: 'My Billings', billings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
