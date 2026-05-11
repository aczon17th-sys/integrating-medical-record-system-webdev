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

## Deploying to GitHub and Render with Aiven MySQL

1. Push this folder to GitHub.
2. Create an Aiven MySQL service.
3. In Aiven, open the MySQL service overview and copy the host, port, username, password, database name, and CA certificate.
4. Run `database/schema.sql` on the Aiven database:

   ```bash
   mysql --ssl-mode=REQUIRED -h your-aiven-host.aivencloud.com -P 12345 -u avnadmin -p defaultdb < database/schema.sql
   ```

   Replace the host, port, user, and database with your Aiven values.

5. In Render, create a new Web Service from the GitHub repository.
6. Set environment variables:

   ```text
   DATABASE_URL=mysql://avnadmin:your-password@your-aiven-host.aivencloud.com:12345/defaultdb
   DB_SSL=true
   DB_SSL_CA=your-aiven-ca-certificate
   SESSION_SECRET=your-secure-secret
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   ```

   You may set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` instead of `DATABASE_URL`.

7. Render will use:

   ```text
   Build Command: npm install
   Start Command: npm start
   ```
