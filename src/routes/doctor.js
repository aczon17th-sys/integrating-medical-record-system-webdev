const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('doctor'));

router.get('/records', async (req, res, next) => {
  try {
    const [appointments] = await pool.query(
      `SELECT a.*, p.first_name AS patient_first, p.last_name AS patient_last
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       WHERE a.doctor_id = ?
       ORDER BY a.scheduled_at DESC`,
      [req.session.user.id]
    );
    const [records] = await pool.query(
      `SELECT r.*, p.first_name AS patient_first, p.last_name AS patient_last
       FROM medical_records r
       JOIN users p ON p.id = r.patient_id
       WHERE r.doctor_id = ?
       ORDER BY r.created_at DESC`,
      [req.session.user.id]
    );
    res.render('doctor/records', { title: 'Findings and Prescriptions', appointments, records });
  } catch (error) {
    next(error);
  }
});

router.post('/records', async (req, res, next) => {
  try {
    const { appointment_id, findings, prescription } = req.body;
    const [appointments] = await pool.query(
      'SELECT patient_id FROM appointments WHERE id = ? AND doctor_id = ?',
      [appointment_id, req.session.user.id]
    );

    if (!appointments[0]) {
      req.session.notice = { type: 'error', message: 'Appointment not found for this doctor.' };
      return res.redirect('/doctor/records');
    }

    await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
       VALUES (?, ?, ?, ?, ?)`,
      [appointments[0].patient_id, req.session.user.id, appointment_id, findings, prescription]
    );

    await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ? AND doctor_id = ?", [
      appointment_id,
      req.session.user.id
    ]);

    req.session.notice = { type: 'success', message: 'Medical findings and prescription saved.' };
    res.redirect('/doctor/records');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
