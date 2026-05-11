const fs = require('fs');

function readSslCa(value) {
  if (!value) {
    return undefined;
  }

  if (fs.existsSync(value)) {
    return fs.readFileSync(value, 'utf8');
  }

  return value.replace(/\\n/g, '\n');
}

function getMysqlSslOptions() {
  const sslEnabled = process.env.DB_SSL === 'true' || Boolean(process.env.DB_SSL_CA);

  if (!sslEnabled) {
    return undefined;
  }

  const ca = readSslCa(process.env.DB_SSL_CA);

  return ca
    ? { ca, rejectUnauthorized: true }
    : { rejectUnauthorized: false };
}

module.exports = { getMysqlSslOptions };
