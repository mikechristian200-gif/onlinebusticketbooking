import postgres from 'postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set. Add it to .env.local before using database features.');
}

const connectionString = process.env.POSTGRES_URL;
const needsSsl =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('sslmode=require') ||
  connectionString.includes('neon.tech');

/**
 * Runtime database client.
 * Schema changes are intentionally not performed here. Run `pnpm db:migrate`
 * during deployment or setup before starting the app.
 */
export const sql = postgres(connectionString, {
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.POSTGRES_POOL_SIZE || 10),
  idle_timeout: 20,
  connect_timeout: 10,
});
