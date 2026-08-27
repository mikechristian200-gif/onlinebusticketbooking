import { sql } from '@/app/lib/db';

export async function GET() {
  try {
    await sql`SELECT 1;`;
    return Response.json({ status: 'ok', database: 'ok' });
  } catch {
    return Response.json({ status: 'error', database: 'unavailable' }, { status: 503 });
  }
}