const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

const backupDirectory = path.join(process.cwd(), 'backups');
fs.mkdirSync(backupDirectory, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(backupDirectory, `golden-express-${stamp}.dump`);

const result = spawnSync('pg_dump', [
  '--dbname', process.env.POSTGRES_URL,
  '--format=custom',
  '--file', output,
  '--no-owner',
  '--no-privileges',
], { stdio: 'inherit', windowsHide: true });

if (result.error) {
  console.error(`Could not run pg_dump: ${result.error.message}`);
  console.error('Install PostgreSQL client tools and ensure pg_dump is on PATH.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);

console.log(`Backup written to ${path.relative(process.cwd(), output)}`);
