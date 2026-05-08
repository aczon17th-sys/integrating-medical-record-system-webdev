const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'nurse', 'receptionist'));

router.get('/patients', async (req, res, next) => {
  try {
    const [patients] = await pool.query("SELECT * FROM users WHERE role = 'patient' ORDER BY last_name, first_name");
    res.render('staff/patients', { title: 'Patients', patients });
  } catch (error) {
    next(error);
  }
});

router.get('/patients/new', (req, res) => {
  res.render('staff/patient-form', { title: 'Create Patient Account' });
});

router.post('/patients', async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, address, date_of_birth, gender } = req.body;
    const passwordHash = await bcrypt.hash(password || 'patient123', 10);

    await pool.query(
      `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
       VALUES ('patient', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, passwordHash, phone, address, date_of_birth || null, gender]
    );

    req.session.notice = { type: 'success', message: 'Patient account created.' };
    res.redirect('/staff/patients');
  } catch (error) {
    next(error);
  }
});

router.get('/appointments', async (req, res, next) => {
  try {
    const [appointments] = await pool.query(
      `SELECT a.*, p.first_name AS patient_first, p.last_name AS patient_last,
              d.first_name AS doctor_first, d.last_name AS doctor_last
       FROM appointments a
       JOIN users p ON p.id = a.patient_id
       LEFT JOIN users d ON d.id = a.doctor_id
       ORDER BY a.scheduled_at DESC`
    );
    const [patients] = await pool.query("SELECT id, first_name, last_name FROM users WHERE role = 'patient' ORDER BY last_name");
    const [doctors] = await pool.query("SELECT id, first_name, last_name FROM users WHERE role = 'doctor' ORDER BY last_name");
    res.render('staff/appointments', { title: 'Appointments', appointments, patients, doctors });
  } catch (error) {
    next(error);
  }
});

router.post('/appointments', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, scheduled_at, reason, status } = req.body;
    await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, doctor_id || null, scheduled_at, reason, status || 'scheduled', req.session.user.id]
    );

    req.session.notice = { type: 'success', message: 'Appointment saved.' };
    res.redirect('/staff/appointments');
  } catch (error) {
    next(error);
  }
});

router.put('/appointments/:id/status', async (req, res, next) => {
  try {
    await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    req.session.notice = { type: 'success', message: 'Appointment status updated.' };
    res.redirect('/staff/appointments');
  } catch (error) {
    next(error);
  }
});

router.get('/billings', async (req, res, next) => {
  try {
    const [billings] = await pool.query(
      `SELECT b.*, p.first_name AS patient_first, p.last_name AS patient_last
       FROM billings b
       JOIN users p ON p.id = b.patient_id
       ORDER BY b.created_at DESC`
    );
    const [patients] = await pool.query("SELECT id, first_name, last_name FROM users WHERE role = 'patient' ORDER BY last_name");
    const [appointments] = await pool.query('SELECT id, patient_id, scheduled_at FROM appointments ORDER BY scheduled_at DESC');
    res.render('staff/billings', { title: 'Billings', billings, patients, appointments });
  } catch (error) {
    next(error);
  }
});

router.post('/billings', async (req, res, next) => {
  try {
    const { patient_id, appointment_id, amount, description, status } = req.body;
    await pool.query(
      `INSERT INTO billings (patient_id, appointment_id, amount, description, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [patient_id, appointment_id || null, amount, description, status || 'unpaid', req.session.user.id]
    );

    req.session.notice = { type: 'success', message: 'Billing record created.' };
    res.redirect('/staff/billings');
  } catch (error) {
    next(error);
  }
});

router.put('/billings/:id/status', async (req, res, next) => {
  try {
    await pool.query('UPDATE billings SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    req.session.notice = { type: 'success', message: 'Billing status updated.' };
    res.redirect('/staff/billings');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
