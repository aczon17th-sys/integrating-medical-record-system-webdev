# Integrating Medical Record and Appointment Scheduling System

A Node.js, JavaScript, Express, and MySQL system that combines patient medical records, appointment scheduling, doctor findings, prescriptions, and billing in one platform.

## Roles

- **Admin**: full CRUD access, manages doctors, nurses, receptionists, patients, appointments, medical records, and billings.
- **Nurse / Receptionist**: same permissions. Can create patient accounts, manage appointments, create billings, and book follow-up visits.
- **Doctor**: can only add patient findings and prescriptions.
- **Patient**: can create appointment requests and view billings. Patients cannot edit their personal data.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a MySQL database and tables:

   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. Copy `.env.example` to `.env` and update the database credentials.

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open:

   ```text
   http://localhost:3000
   ```

## Default Admin Login

- Email: `admin@system.local`
- Password: `admin123`

Change this password after first login.

## Deploying to GitHub and Render

1. Push this folder to GitHub.
2. Create a MySQL database using a hosted provider such as PlanetScale, Railway, Aiven, or another MySQL-compatible service.
3. Run `database/schema.sql` on that hosted database.
4. In Render, create a new Web Service from the GitHub repository.
5. Set environment variables:

   ```text
   DATABASE_URL=mysql://user:password@host:3306/database
   SESSION_SECRET=your-secure-secret
   NODE_ENV=production
   ```

6. Render will use:

   ```text
   Build Command: npm install
   Start Command: npm start
   ```
