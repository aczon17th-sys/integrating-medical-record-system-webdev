CREATE DATABASE IF NOT EXISTS medical_record_system;
USE medical_record_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('admin','doctor','nurse','receptionist','patient') NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR(30),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT,
  scheduled_at DATETIME NOT NULL,
  reason TEXT,
  status ENUM('requested','scheduled','completed','cancelled') NOT NULL DEFAULT 'requested',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  findings TEXT NOT NULL,
  prescription TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS billings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('unpaid','paid','cancelled') NOT NULL DEFAULT 'unpaid',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, gender)
SELECT 'admin', 'System', 'Admin', 'admin@system.local',
       '$2a$10$7KK2jUsICtNWU64CRRFsheSYJkkQRCyZFNHGwEFCQh.Q4NjezGmJi',
       '0000000000', 'Clinic Office', 'N/A'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@system.local');

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, gender)
SELECT 'doctor', 'Maria', 'Santos', 'doctor@system.local',
       '$2a$10$nf0ZQpxFwnLGUB2SN9iiP.wZ6zgZvGCmOayz/W4iDLwAVeVKhy3IW',
       '09170000001', 'Clinic Office', 'Female'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'doctor@system.local');

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
SELECT 'patient', 'Juan', 'Dela Cruz', 'juan.delacruz@example.com',
       '$2a$10$yPtmffG.XHUZQU03kc3pk.7/.NwbrY9Xbi9siLgpsu2UJYZWirLg6',
       '09181234501', 'Purok 1, Barangay Tawog', '1990-03-12', 'Male'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'juan.delacruz@example.com');

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
SELECT 'patient', 'Maria', 'Reyes', 'maria.reyes@example.com',
       '$2a$10$yPtmffG.XHUZQU03kc3pk.7/.NwbrY9Xbi9siLgpsu2UJYZWirLg6',
       '09181234502', 'Purok 2, Barangay Tawog', '1985-07-22', 'Female'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'maria.reyes@example.com');

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
SELECT 'patient', 'Carlo', 'Mendoza', 'carlo.mendoza@example.com',
       '$2a$10$yPtmffG.XHUZQU03kc3pk.7/.NwbrY9Xbi9siLgpsu2UJYZWirLg6',
       '09181234503', 'Purok 3, Barangay Tawog', '1978-11-05', 'Male'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'carlo.mendoza@example.com');

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
SELECT 'patient', 'Liza', 'Garcia', 'liza.garcia@example.com',
       '$2a$10$yPtmffG.XHUZQU03kc3pk.7/.NwbrY9Xbi9siLgpsu2UJYZWirLg6',
       '09181234504', 'Purok 4, Barangay Tawog', '1995-01-18', 'Female'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'liza.garcia@example.com');

INSERT INTO users (role, first_name, last_name, email, password_hash, phone, address, date_of_birth, gender)
SELECT 'patient', 'Ana', 'Villanueva', 'ana.villanueva@example.com',
       '$2a$10$yPtmffG.XHUZQU03kc3pk.7/.NwbrY9Xbi9siLgpsu2UJYZWirLg6',
       '09181234505', 'Purok 5, Barangay Tawog', '2001-09-30', 'Female'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ana.villanueva@example.com');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
SELECT p.id, d.id, '2026-05-12 09:00:00', 'Follow-up check for blood pressure monitoring', 'completed', a.id
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN users a ON a.email = 'admin@system.local'
WHERE p.email = 'juan.delacruz@example.com'
  AND NOT EXISTS (SELECT 1 FROM appointments x WHERE x.patient_id = p.id AND x.reason = 'Follow-up check for blood pressure monitoring');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
SELECT p.id, d.id, '2026-05-12 10:00:00', 'Consultation for recurring headache', 'completed', a.id
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN users a ON a.email = 'admin@system.local'
WHERE p.email = 'maria.reyes@example.com'
  AND NOT EXISTS (SELECT 1 FROM appointments x WHERE x.patient_id = p.id AND x.reason = 'Consultation for recurring headache');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
SELECT p.id, d.id, '2026-05-13 09:30:00', 'Diabetes review and medication check', 'completed', a.id
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN users a ON a.email = 'admin@system.local'
WHERE p.email = 'carlo.mendoza@example.com'
  AND NOT EXISTS (SELECT 1 FROM appointments x WHERE x.patient_id = p.id AND x.reason = 'Diabetes review and medication check');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
SELECT p.id, d.id, '2026-05-13 14:00:00', 'Prenatal wellness consultation', 'completed', a.id
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN users a ON a.email = 'admin@system.local'
WHERE p.email = 'liza.garcia@example.com'
  AND NOT EXISTS (SELECT 1 FROM appointments x WHERE x.patient_id = p.id AND x.reason = 'Prenatal wellness consultation');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status, created_by)
SELECT p.id, d.id, '2026-05-14 08:30:00', 'General checkup after fever', 'completed', a.id
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN users a ON a.email = 'admin@system.local'
WHERE p.email = 'ana.villanueva@example.com'
  AND NOT EXISTS (SELECT 1 FROM appointments x WHERE x.patient_id = p.id AND x.reason = 'General checkup after fever');

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
SELECT p.id, d.id, ap.id, 'Blood pressure slightly elevated. No chest pain or shortness of breath reported.', 'Losartan 50mg once daily. Low-salt diet and return for BP check in two weeks.'
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN appointments ap ON ap.patient_id = p.id AND ap.reason = 'Follow-up check for blood pressure monitoring'
WHERE p.email = 'juan.delacruz@example.com'
  AND NOT EXISTS (SELECT 1 FROM medical_records r WHERE r.patient_id = p.id AND r.appointment_id = ap.id);

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
SELECT p.id, d.id, ap.id, 'Tension-type headache suspected. Neurologic exam unremarkable.', 'Paracetamol 500mg every 6 hours as needed. Increase fluids and track headache triggers.'
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN appointments ap ON ap.patient_id = p.id AND ap.reason = 'Consultation for recurring headache'
WHERE p.email = 'maria.reyes@example.com'
  AND NOT EXISTS (SELECT 1 FROM medical_records r WHERE r.patient_id = p.id AND r.appointment_id = ap.id);

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
SELECT p.id, d.id, ap.id, 'Fasting glucose remains above target. Patient reports inconsistent diet control.', 'Continue Metformin 500mg twice daily. Nutrition counseling and repeat FBS in one month.'
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN appointments ap ON ap.patient_id = p.id AND ap.reason = 'Diabetes review and medication check'
WHERE p.email = 'carlo.mendoza@example.com'
  AND NOT EXISTS (SELECT 1 FROM medical_records r WHERE r.patient_id = p.id AND r.appointment_id = ap.id);

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
SELECT p.id, d.id, ap.id, 'Prenatal vitals stable. No alarming symptoms noted during consultation.', 'Prenatal vitamins once daily. Schedule follow-up prenatal visit in four weeks.'
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN appointments ap ON ap.patient_id = p.id AND ap.reason = 'Prenatal wellness consultation'
WHERE p.email = 'liza.garcia@example.com'
  AND NOT EXISTS (SELECT 1 FROM medical_records r WHERE r.patient_id = p.id AND r.appointment_id = ap.id);

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, findings, prescription)
SELECT p.id, d.id, ap.id, 'Afebrile today. Mild throat irritation remains, lungs clear.', 'Cetirizine 10mg once daily for five days. Rest and hydration advised.'
FROM users p
JOIN users d ON d.email = 'doctor@system.local'
JOIN appointments ap ON ap.patient_id = p.id AND ap.reason = 'General checkup after fever'
WHERE p.email = 'ana.villanueva@example.com'
  AND NOT EXISTS (SELECT 1 FROM medical_records r WHERE r.patient_id = p.id AND r.appointment_id = ap.id);
