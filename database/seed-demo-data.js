const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function main() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = schemaSql
    .split(';')
    .map(statement => statement.trim())
    .filter(Boolean)
    .filter(statement => !/^CREATE\s+DATABASE\b/i.test(statement))
    .filter(statement => !/^USE\b/i.test(statement));

  for (const statement of statements) {
    await pool.query(statement);
  }

  const [[patientCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'patient'");
  const [[appointmentCount]] = await pool.query('SELECT COUNT(*) AS total FROM appointments');
  const [[recordCount]] = await pool.query('SELECT COUNT(*) AS total FROM medical_records');

  console.log(
    `Seed complete: ${patientCount.total} patients, ${appointmentCount.total} appointments, ${recordCount.total} medical records.`
  );
}

main()
  .then(() => pool.end())
  .catch(error => {
    console.error(error);
    pool.end().finally(() => process.exit(1));
  });
