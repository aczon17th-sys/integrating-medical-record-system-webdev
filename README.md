# Integrating Medical Record and Appointment Scheduling System

A Node.js, JavaScript, Express, and MySQL system that combines patient medical records, appointment scheduling, doctor findings, prescriptions, and billing in one platform.

## Roles

- **Admin**: full CRUD access, manages doctors, staff, patients, appointments, medical records, and billings.
- **Staff / Nurse**: can create patient accounts, manage appointments, create billings, and book follow-up visits.
- **Doctor**: can only add patient findings and prescriptions.
- **Patient**: can create appointment requests and view billings. Patients cannot edit their personal data.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and update the database credentials.

3. Generate a JWT secret and put it in `.env`:

   ```bash
   npm run generate:jwt-secret
   ```

   Your `.env` must contain:

   ```text
   JWT_SECRET=the-generated-value
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open:

   ```text
   http://localhost:3000
   ```

The app uses JWT authentication for the frontend API flow. Sequelize creates and updates the MySQL tables on startup.

## Docker

The Docker image does not copy `.env`, so pass `JWT_SECRET` at runtime. With Docker Compose, keep `JWT_SECRET` in your project `.env`, then run:

```bash
docker compose up --build
```

For plain Docker, pass the variable explicitly:

```bash
docker run -p 5000:5000 --env JWT_SECRET=your-generated-secret medical-record-appointment-system
```

## Default Demo Logins

- Email: `admin@system.local`
- Password: `admin123`
- Staff: `staff@system.local` / `staff123`
- Doctor: `doctor@system.local` / `doctor123`
- Patients: `juan.delacruz@example.com`, `maria.reyes@example.com`, `carlo.mendoza@example.com`, `liza.garcia@example.com`, `ana.villanueva@example.com`
- Patient password: `patient123`

Change or remove demo accounts before production use.

## Deploying to GitHub and Render with Aiven MySQL

1. Push this folder to GitHub.
2. Create an Aiven MySQL service.
3. In Aiven, open the MySQL service overview and copy the host, port, username, password, database name, and CA certificate.
4. In Render, create a new Web Service from the GitHub repository.
5. Set environment variables:

   ```text
   DATABASE_URL=mysql://avnadmin:your-password@your-aiven-host.aivencloud.com:12345/defaultdb
   DB_SSL=true
   DB_SSL_CA=your-aiven-ca-certificate
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   ```

   You may set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` instead of `DATABASE_URL`.

6. Render will use:

   ```text
   Build Command: npm install
   Start Command: npm start
   ```
