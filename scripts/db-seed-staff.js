const crypto = require('crypto');
const fs = require('fs');
const postgres = require('postgres');

for (const file of ['.env.local', '.env']) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL is missing. Add it to .env.local.');
  process.exit(1);
}

const users = process.env.INITIAL_ADMIN_EMAIL
  ? [{ name: process.env.INITIAL_ADMIN_NAME || 'Company Admin', email: process.env.INITIAL_ADMIN_EMAIL, password: process.env.INITIAL_ADMIN_PASSWORD, role: 'admin' }]
  : process.env.NODE_ENV === 'production' ? [] : [
    { name: 'Company Admin', email: 'admin@goldenexpress.cm', password: 'admin123', role: 'admin' },
    { name: 'Operations Manager', email: 'manager@goldenexpress.cm', password: 'manager123', role: 'manager' },
    { name: 'Bus Driver', email: 'driver@goldenexpress.cm', password: 'driver123', role: 'driver' },
  ];
if (users.some((user) => !user.password)) {
  console.error('INITIAL_ADMIN_PASSWORD is required when INITIAL_ADMIN_EMAIL is set.');
  process.exit(1);
}

const connectionString = process.env.POSTGRES_URL;
const sql = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});
const hashPassword = (password) => crypto.pbkdf2Sync(password, 'golden-express-salt', 100000, 64, 'sha512').toString('hex');

async function main() {
  for (const user of users) {
    await sql`
      INSERT INTO staff_users (name, email, password_hash, role, role_id)
      VALUES (${user.name}, ${user.email.trim().toLowerCase()}, ${hashPassword(user.password)}, ${user.role}, ${user.role})
      ON CONFLICT DO NOTHING;
    `;
  }
  console.log(`staff_accounts_checked: ${users.length}`);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await sql.end();
});
