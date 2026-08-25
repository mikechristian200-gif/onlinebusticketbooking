const fs = require('fs');
const postgres = require('postgres');

for (const file of ['.env.local', '.env']) {
  if (!fs.existsSync(file)) {
    continue;
  }

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0 || line.trimStart().startsWith('#')) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is missing. Add it to .env.local.');
  process.exit(1);
}

const needsSsl =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('neon.tech');

const sql = postgres(connectionString, {
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  onnotice: () => {},
});

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      capacity INT NOT NULL,
      amenities JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      date DATE NOT NULL,
      departure TEXT NOT NULL,
      arrival TEXT NOT NULL,
      duration TEXT NOT NULL,
      bus_name TEXT NOT NULL,
      price INT NOT NULL,
      amenities JSONB NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS seats (
      id TEXT NOT NULL,
      route_id TEXT NOT NULL REFERENCES routes(id),
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      available BOOLEAN NOT NULL,
      price INT NOT NULL,
      PRIMARY KEY (id, route_id)
    );
  `;

  await sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS bus_id TEXT REFERENCES buses(id);`;
  await sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';`;
  await sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_id TEXT;`;
  await sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS delay_minutes INT NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();`;
  await sql`ALTER TABLE routes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();`;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      route_id TEXT NOT NULL REFERENCES routes(id),
      passenger_name TEXT NOT NULL,
      passenger_email TEXT NOT NULL,
      passenger_phone TEXT,
      seats JSONB NOT NULL,
      total_amount INT NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_phone TEXT;`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount INT NOT NULL DEFAULT 0;`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id TEXT;`;

  const db = await sql`SELECT current_database() AS name`;
  const tables = await sql`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('routes', 'seats', 'bookings')
    ORDER BY tablename;
  `;
  const columns = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('routes', 'seats', 'bookings')
    ORDER BY table_name, column_name;
  `;
  const counts = await sql`
    SELECT 'routes' AS table_name, COUNT(*)::int AS count FROM routes
    UNION ALL
    SELECT 'seats' AS table_name, COUNT(*)::int AS count FROM seats
    UNION ALL
    SELECT 'bookings' AS table_name, COUNT(*)::int AS count FROM bookings
    ORDER BY table_name;
  `;

  const requiredColumns = {
    routes: ['amenities', 'arrival', 'bus_id', 'bus_name', 'created_at', 'date', 'delay_minutes', 'departure', 'destination', 'driver_id', 'duration', 'id', 'origin', 'price', 'status', 'updated_at'],
    seats: ['available', 'id', 'label', 'price', 'route_id', 'type'],
    bookings: [
      'created_at',
      'customer_id',
      'id',
      'passenger_email',
      'passenger_name',
      'passenger_phone',
      'payment_method',
      'reference',
      'route_id',
      'seats',
      'status',
      'total_amount',
    ],
  };
  const existingColumns = columns.reduce((grouped, row) => {
    grouped[row.table_name] ??= new Set();
    grouped[row.table_name].add(row.column_name);
    return grouped;
  }, {});
  const missingColumns = Object.entries(requiredColumns).flatMap(([table, names]) =>
    names
      .filter((name) => !existingColumns[table]?.has(name))
      .map((name) => `${table}.${name}`),
  );

  console.log(`connected: ${Boolean(db[0]?.name)}`);
  console.log(`booking_tables: ${tables.map((row) => row.tablename).join(',') || '(none)'}`);
  console.log(`row_counts: ${counts.map((row) => `${row.table_name}=${row.count}`).join(', ')}`);

  if (missingColumns.length > 0) {
    console.error(`missing_columns: ${missingColumns.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('schema: ok');
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
