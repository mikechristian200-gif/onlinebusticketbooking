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

const connectionString = process.env.POSTGRES_URL;
const sql = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  onnotice: () => {},
});
const requiredTables = ['customers', 'staff_roles', 'permissions', 'staff_role_permissions', 'staff_users', 'buses', 'routes', 'schedules', 'seats', 'bookings', 'booking_seats', 'payments', 'cancellations', 'refunds', 'notifications', 'audit_logs', 'rate_limit_buckets'];

async function main() {
  const database = await sql`SELECT current_database() AS name;`;
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`;
  const existing = new Set(tables.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !existing.has(table));
  const migrations = existing.has('schema_migrations') ? await sql`SELECT version FROM schema_migrations ORDER BY version;` : [];
  const foreignKeys = await sql`SELECT COUNT(*)::int AS count FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY';`;
  console.log(`connected: ${Boolean(database[0]?.name)}`);
  console.log(`normalized_tables: ${requiredTables.filter((table) => existing.has(table)).join(',') || '(none)'}`);
  console.log(`migrations: ${migrations.map((row) => row.version).join(',') || '(none)'}`);
  console.log(`foreign_keys: ${foreignKeys[0].count}`);
  if (missing.length) {
    console.error(`missing_tables: ${missing.join(', ')}`);
    console.error('Run pnpm db:migrate before starting the application.');
    process.exitCode = 1;
    return;
  }
  const counts = await sql`
    SELECT 'customers' AS table_name, COUNT(*)::int AS count FROM customers
    UNION ALL SELECT 'buses', COUNT(*)::int FROM buses
    UNION ALL SELECT 'schedules', COUNT(*)::int FROM schedules
    UNION ALL SELECT 'seats', COUNT(*)::int FROM seats
    UNION ALL SELECT 'bookings', COUNT(*)::int FROM bookings
    UNION ALL SELECT 'payments', COUNT(*)::int FROM payments
    ORDER BY table_name;
  `;
  console.log(`row_counts: ${counts.map((row) => `${row.table_name}=${row.count}`).join(', ')}`);
  console.log('schema: ok');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await sql.end();
});
