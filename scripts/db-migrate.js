const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

loadEnv();
if (!process.env.POSTGRES_URL) {
  console.error('POSTGRES_URL is missing. Add it to .env.local.');
  process.exit(1);
}

const connectionString = process.env.POSTGRES_URL;
const sql = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require') || connectionString.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
  onnotice: () => {},
});

async function main() {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`;

  const directory = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.sql')).sort();
  const applied = await sql`SELECT version FROM schema_migrations ORDER BY version;`;
  const appliedVersions = new Set(applied.map((row) => row.version));

  for (const file of files) {
    if (appliedVersions.has(file)) continue;
    console.log(`Applying ${file}...`);
    const migration = fs.readFileSync(path.join(directory, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(migration);
      await tx`INSERT INTO schema_migrations (version) VALUES (${file});`;
    });
    console.log(`Applied ${file}`);
  }

  console.log('Database migrations are up to date.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  await sql.end();
});
