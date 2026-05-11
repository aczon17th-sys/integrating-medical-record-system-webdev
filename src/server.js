const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
require('dotenv').config();

const { currentUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/login.html', (req, res) => res.redirect('/login'));
app.get('/dashboard.html', (req, res) => res.redirect('/dashboard'));
app.get('/accounts.html', (req, res) => res.redirect('/admin/users'));
app.get('/patients.html', (req, res) => res.redirect('/admin/patients'));
app.get('/appointments.html', (req, res) => res.redirect('/admin/appointments'));
app.get('/diagnosis.html', (req, res) => res.redirect('/admin/records'));
app.get('/billing.html', (req, res) => res.redirect('/staff/billings'));
app.use(express.static(path.join(__dirname, '..', 'public'), { index: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);
app.use(currentUser);

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);
app.use('/doctor', doctorRoutes);
app.use('/patient', patientRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render('error', {
    title: 'System error',
    message: 'Something went wrong. Please check the server logs and database settings.'
  });
});

app.listen(port, () => {
  console.log(`Medical record system running on http://localhost:${port}`);
});
