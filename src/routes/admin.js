const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

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
    allowedRoles: ['doctor', 'nurse', 'receptionist', 'patient'],
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
      allowedRoles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient'],
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

module.exports = router;
