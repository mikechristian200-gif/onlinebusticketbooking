import { ensureAuthTables, getCurrentUser } from '@/app/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (user.role !== 'admin' && user.role !== 'manager') {
    return Response.json({ error: 'Staff access required' }, { status: 403 });
  }

  try {
    const { sql } = await import('@/app/lib/db');
    await ensureAuthTables();
    const drivers = await sql`
      SELECT id, name, email
      FROM staff_users
      WHERE role = 'driver'
      ORDER BY name ASC;
    `;
    return Response.json(drivers);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to load drivers' }, { status: 500 });
  }
}
