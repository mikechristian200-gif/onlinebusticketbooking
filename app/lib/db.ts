import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set. Add it to .env.local before using database features.');
}

const connectionString = process.env.POSTGRES_URL;
const needsSsl =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('neon.tech');

export const sql = postgres(connectionString, {
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
});

export async function ensureBookingTables(client = sql) {
  await client`
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

  await client`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      bus_id TEXT REFERENCES buses(id),
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

  await client`ALTER TABLE routes ADD COLUMN IF NOT EXISTS bus_id TEXT REFERENCES buses(id);`;
  await client`ALTER TABLE routes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled';`;
  await client`ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_id TEXT;`;
  await client`ALTER TABLE routes ADD COLUMN IF NOT EXISTS delay_minutes INT NOT NULL DEFAULT 0;`;
  await client`ALTER TABLE routes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();`;
  await client`ALTER TABLE routes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();`;

  await client`
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

  await client`
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

  await client`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_phone TEXT;`;
  await client`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount INT NOT NULL DEFAULT 0;`;
  await client`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';`;
  await client`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed';`;
  await client`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id TEXT;`;
}
