import { sql } from '@/app/lib/db';
import { Bus } from '@/app/lib/definitions';
import { getCurrentUser } from '@/app/lib/auth';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
  return null;
}

// GET all buses
export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const buses = await sql<Bus[]>`
      SELECT 
        id,
        name,
        type,
        capacity,
        amenities,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM buses
      ORDER BY created_at DESC
    `;
    return Response.json(buses);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch buses';
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST - Create new bus
export async function POST(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const body = await req.json();
    const { name, type, capacity, amenities } = body;

    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      typeof type !== 'string' ||
      type.trim() === '' ||
      typeof capacity !== 'number' ||
      capacity <= 0 ||
      !Array.isArray(amenities)
    ) {
      return Response.json(
        { error: 'Invalid bus data. Provide name, type, capacity (number), and amenities (array).' },
        { status: 400 }
      );
    }

    
    const busId = `bus-${Math.random().toString(36).slice(2, 10)}`;
    
    const result = await sql<Bus[]>`
      INSERT INTO buses (id, name, type, capacity, amenities)
      VALUES (${busId}, ${name.trim()}, ${type.trim()}, ${capacity}, ${sql.json(amenities)})
      RETURNING 
        id,
        name,
        type,
        capacity,
        amenities,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create bus';
    const status = message.includes('duplicate key') ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}

// PUT - Update bus
export async function PUT(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const body = await req.json();
    const { id, name, type, capacity, amenities } = body;

    if (!id || typeof id !== 'string') {
      return Response.json({ error: 'Bus ID is required' }, { status: 400 });
    }

    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      typeof type !== 'string' ||
      type.trim() === '' ||
      typeof capacity !== 'number' ||
      capacity <= 0 ||
      !Array.isArray(amenities)
    ) {
      return Response.json(
        { error: 'Invalid bus data. Provide name, type, capacity (number), and amenities (array).' },
        { status: 400 }
      );
    }


    const result = await sql<Bus[]>`
      UPDATE buses
      SET 
        name = ${name.trim()},
        type = ${type.trim()},
        capacity = ${capacity},
        amenities = ${sql.json(amenities)},
        updated_at = now()
      WHERE id = ${id}
      RETURNING 
        id,
        name,
        type,
        capacity,
        amenities,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (result.length === 0) {
      return Response.json({ error: 'Bus not found' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update bus';
    return Response.json({ error: message }, { status: 500 });
  }
}

// DELETE bus
export async function DELETE(req: Request) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Bus ID is required' }, { status: 400 });
    }


    const result = await sql`
      DELETE FROM buses
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: 'Bus not found' }, { status: 404 });
    }

    return Response.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete bus';
    return Response.json({ error: message }, { status: 500 });
  }
}
