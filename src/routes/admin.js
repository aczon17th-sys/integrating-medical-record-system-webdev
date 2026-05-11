const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

const userRoles = ['admin', 'doctor', 'nurse', 'receptionist', 'patient'];
const staffCreatableRoles = ['doctor', 'nurse', 'receptionist', 'patient'];
const appointmentStatuses = ['requested', 'scheduled', 'completed', 'cancelled'];

function formatDateForInput(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTimeForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

async function getPatientOptions() {
  const [patients] = await pool.query(
    "SELECT id, first_name, last_name FROM users WHERE role = 'patient' ORDER BY last_name, first_name"
  );
  return patients;
}

async function getDoctorOptions() {
  const [doctors] = await pool.query(
    "SELECT id, first_name, last_name FROM users WHERE role = 'doctor' ORDER BY last_name, first_name"
  );
  return doctors;
}

async function getAppointmentOptions() {
  const [appointments] = await pool.query(
    `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at,
            p.first_name AS patient_first, p.last_name AS patient_last,
            d.first_name AS doctor_first, d.last_name AS doctor_last
     FROM appointments a
     JOIN users p ON p.id = a.patient_id
     LEFT JOIN users d ON d.id = a.doctor_id
     ORDER BY a.scheduled_at DESC`
  );
  return appointments;
}

router.get('/users', async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT * FROM users ORDER BY role, last_name, first_name');
    res.render('admin/users', { title: 'Manage Users', users });
  } catch (error) {
    next(error);
  }
});

router.get('/users/new', (req, res) => {
    res.render('admin/user-form', {
      title: 'Create User',
      user: null,
      allowedRoles: staffCreatableRoles,
      action: '/admin/users'
    });
});

router.post('/users', async (req, res, next) => {
  try {
    const { role, first_name, last_name, email, password, phone, address, date_of_birth, gender } = req.body;
    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    await pool.query(
      `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [role, first_name, last_name, email, passwordHash, phone, address, date_of_birth || null, gender]
    );

    req.session.notice = { type: 'success', message: 'User created successfully.' };
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).render('error', { title: 'Not found', message: 'User not found.' });

    res.render('admin/user-form', {
      title: 'Edit User',
      user: rows[0],
      allowedRoles: userRoles,
      action: `/admin/users/${req.params.id}?_method=PUT`
    });
  } catch (error) {
    next(error);
  }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, first_name, last_name, email, password, phone, address, date_of_birth, gender, is_active } = req.body;

    await pool.query(
      `UPDATE users
       SET role = ?, first_name = ?, last_name = ?, email = ?, phone = ?, address = ?,
           date_of_birth = ?, gender = ?, is_active = ?
       WHERE id = ?`,
      [role, first_name, last_name, email, phone, address, date_of_birth || null, gender, is_active === 'on', req.params.id]
    );

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.params.id]);
    }

    req.session.notice = { type: 'success', message: 'User updated successfully.' };
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.session.user.id) {
      req.session.notice = { type: 'error', message: 'You cannot delete your own admin account while logged in.' };
      return res.redirect('/admin/users');
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    req.session.notice = { type: 'success', message: 'User deleted successfully.' };
    res.redirect('/admin/users');
  } catch (error) {
    next(error);
  }
});

router.get('/patients', async (req, res, next) => {
  try {
    const [patients] = await pool.query(
      `SELECT p.*,
              COUNT(DISTINCT a.id) AS appointment_count,
              COUNT(DISTINCT r.id) AS record_count,
              MAX(a.scheduled_at) AS latest_appointment
       FROM users p
       LEFT JOIN appointments a ON a.patient_id = p.id
       LEFT JOIN medical_records r ON r.patient_id = p.id
       WHERE p.role = 'patient'
       GROUP BY p.id
       ORDER BY p.last_name, p.first_name`
    );

    res.render('admin/patients', { title: 'Manage Patients', patients });
  } catch (error) {
    next(error);
  }
});

router.get('/patients/new', (req, res) => {
  res.render('admin/patient-form', {
    title: 'Create Patient',
    patient: null,
    action: '/admin/patients',
    formatDateForInput
  });
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
    res.redirect('/admin/patients');
  } catch (error) {
    next(error);
  }
});

router.get('/patients/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? AND role = 'patient'", [req.params.id]);
    if (!rows[0]) return res.status(404).render('error', { title: 'Not found', message: 'Patient not found.' });

    res.render('admin/patient-form', {
      title: 'Edit Patient',
      patient: rows[0],
      action: `/admin/patients/${req.params.id}?_method=PUT`,
      formatDateForInput
    });
  } catch (error) {
    next(error);
  }
});

router.put('/patients/:id', async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone, address, date_of_birth, gender, is_active } = req.body;

    await pool.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?,
           date_of_birth = ?, gender = ?, is_active = ?
       WHERE id = ? AND role = 'patient'`,
      [first_name, last_name, email, phone, address, date_of_birth || null, gender, is_active === 'on', req.params.id]
    );

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'patient'", [
        passwordHash,
        req.params.id
      ]);
    }

    req.session.notice = { type: 'success', message: 'Patient updated.' };
    res.redirect('/admin/patients');
  } catch (error) {
    next(error);
  }
});

router.delete('/patients/:id', async (req, res, next) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'patient'", [req.params.id]);
    req.session.notice = { type: 'success', message: 'Patient deleted.' };
    res.redirect('/admin/patients');
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

    res.render('admin/appointments', { title: 'Manage Appointments', appointments });
  } catch (error) {
    next(error);
  }
});

router.get('/appointments/new', async (req, res, next) => {
  try {
    res.render('admin/appointment-form', {
      title: 'Create Appointment',
      appointment: null,
      patients: await getPatientOptions(),
      doctors: await getDoctorOptions(),
      statuses: appointmentStatuses,
      action: '/admin/appointments',
      formatDateTimeForInput
    });
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

    req.session.notice = { type: 'success', message: 'Appointment created.' };
    res.redirect('/admin/appointments');
  } catch (error) {
    next(error);
  }
});

router.get('/appointments/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).render('error', { title: 'Not found', message: 'Appointment not found.' });

    res.render('admin/appointment-form', {
      title: 'Edit Appointment',
      appointment: rows[0],
      patients: await getPatientOptions(),
      doctors: await getDoctorOptions(),
      statuses: appointmentStatuses,
      action: `/admin/appointments/${req.params.id}?_method=PUT`,
      formatDateTimeForInput
    });
  } catch (error) {
    next(error);
  }
});

router.put('/appointments/:id', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, scheduled_at, reason, status } = req.body;
    await pool.query(
      `UPDATE appointments
       SET patient_id = ?, doctor_id = ?, scheduled_at = ?, reason = ?, status = ?
       WHERE id = ?`,
      [patient_id, doctor_id || null, scheduled_at, reason, status, req.params.id]
    );

    req.session.notice = { type: 'success', message: 'Appointment updated.' };
    res.redirect('/admin/appointments');
  } catch (error) {
    next(error);
  }
});

router.delete('/appointments/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    req.session.notice = { type: 'success', message: 'Appointment deleted.' };
    res.redirect('/admin/appointments');
  } catch (error) {
    next(error);
  }
});

router.get('/records', async (req, res, next) => {
  try {
    const [records] = await pool.query(
      `SELECT r.*, p.first_name AS patient_first, p.last_name AS patient_last,
              d.first_name AS doctor_first, d.last_name AS doctor_last,
              a.scheduled_at
       FROM medical_records r
       JOIN users p ON p.id = r.patient_id
       JOIN users d ON d.id = r.doctor_id
       LEFT JOIN appointments a ON a.id = r.appointment_id
       ORDER BY r.created_at DESC`
    );

    res.render('admin/records', { title: 'Manage Medical Records', records });
  } catch (error) {
    next(error);
  }
});

router.get('/records/new', async (req, res, next) => {
  try {
    res.render('admin/record-form', {
      title: 'Create Medical Record',
      record: null,
      patients: await getPatientOptions(),
      doctors: await getDoctorOptions(),
      appointments: await getAppointmentOptions(),
      action: '/admin/records'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/records', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appointment_id, findings, prescription } = req.body;
    await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
       VALUES (?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, appointment_id || null, findings, prescription]
    );

    if (appointment_id) {
      await pool.query("UPDATE appointments SET status = 'completed' WHERE id = ?", [appointment_id]);
    }

    req.session.notice = { type: 'success', message: 'Medical record created.' };
    res.redirect('/admin/records');
  } catch (error) {
    next(error);
  }
});

router.get('/records/:id/edit', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medical_records WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).render('error', { title: 'Not found', message: 'Medical record not found.' });

    res.render('admin/record-form', {
      title: 'Edit Medical Record',
      record: rows[0],
      patients: await getPatientOptions(),
      doctors: await getDoctorOptions(),
      appointments: await getAppointmentOptions(),
      action: `/admin/records/${req.params.id}?_method=PUT`
    });
  } catch (error) {
    next(error);
  }
});

router.put('/records/:id', async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appointment_id, findings, prescription } = req.body;
    await pool.query(
      `UPDATE medical_records
       SET patient_id = ?, doctor_id = ?, appointment_id = ?, findings = ?, prescription = ?
       WHERE id = ?`,
      [patient_id, doctor_id, appointment_id || null, findings, prescription, req.params.id]
    );

    req.session.notice = { type: 'success', message: 'Medical record updated.' };
    res.redirect('/admin/records');
  } catch (error) {
    next(error);
  }
});

router.delete('/records/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM medical_records WHERE id = ?', [req.params.id]);
    req.session.notice = { type: 'success', message: 'Medical record deleted.' };
    res.redirect('/admin/records');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
