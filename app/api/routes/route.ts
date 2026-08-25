import { randomUUID } from 'crypto';
import { ensureAuthTables, getCurrentUser } from '@/app/lib/auth';
import { ensureBookingTables, sql } from '@/app/lib/db';
import { RouteStatus } from '@/app/lib/definitions';

const ROUTE_STATUSES: RouteStatus[] = ['scheduled', 'boarding', 'departed', 'completed', 'cancelled'];

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return jsonError('Authentication required', 401);
  if (user.role !== 'admin') return jsonError('Admin access required', 403);
  return null;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function buildSeats(capacity: number, price: number) {
  const seats: Array<{ id: string; label: string; type: string; price: number }> = [];
  const types = ['window', 'aisle', 'aisle', 'window'];
  for (let index = 0; index < capacity; index += 1) {
    const row = Math.floor(index / 4) + 1;
    const position = index % 4;
    const suffix = ['A', 'B', 'C', 'D'][position];
    const id = `${row}${suffix}`;
    seats.push({ id, label: id, type: types[position], price });
  }
  return seats;
}

function parseRouteInput(body: any) {
  const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  const date = typeof body.date === 'string' ? body.date.trim() : '';
  const departure = typeof body.departure === 'string' ? body.departure.trim() : '';
  const arrival = typeof body.arrival === 'string' ? body.arrival.trim() : '';
  const duration = typeof body.duration === 'string' ? body.duration.trim() : '';
  const busId = typeof body.busId === 'string' ? body.busId.trim() : '';
  const price = Number(body.price);
  const delayMinutes = Number(body.delayMinutes ?? 0);
  const amenities = Array.isArray(body.amenities)
    ? [...new Set(body.amenities.filter((item: unknown): item is string => typeof item === 'string').map((item: string) => item.trim()).filter(Boolean))]
    : [];
  const status = ROUTE_STATUSES.includes(body.status) ? body.status : 'scheduled';
  const driverId = typeof body.driverId === 'string' && body.driverId.trim() ? body.driverId.trim() : null;

  if (!origin || !destination || !isValidDate(date) || !departure || !arrival || !duration || !busId) {
    throw new Error('Origin, destination, date, times, duration, and bus are required.');
  }
  if (!Number.isInteger(price) || price <= 0) {
    throw new Error('Price must be a positive whole number.');
  }
  if (!Number.isInteger(delayMinutes) || delayMinutes < 0) {
    throw new Error('Delay must be zero or a positive whole number of minutes.');
  }

  return { origin, destination, date, departure, arrival, duration, busId, price, amenities, status, driverId, delayMinutes };
}

async function validateDriver(driverId: string | null) {
  if (!driverId) return;
  const rows = await sql`SELECT id FROM staff_users WHERE id = ${driverId} AND role = 'driver' LIMIT 1;`;
  if (!rows[0]) throw new Error('Selected driver was not found.');
}

async function getBus(busId: string) {
  const rows = await sql`SELECT id, name, capacity, amenities FROM buses WHERE id = ${busId} LIMIT 1;`;
  if (!rows[0]) throw new Error('Selected bus was not found.');
  return rows[0];
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await ensureAuthTables();
    await ensureBookingTables();
    const rows = await sql`
      SELECT
        routes.id,
        routes.origin,
        routes.destination,
        routes.date,
        routes.departure,
        routes.arrival,
        routes.duration,
        routes.bus_id AS "busId",
        routes.bus_name AS "busName",
        routes.price,
        routes.amenities,
        routes.status,
        routes.driver_id AS "driverId",
        routes.delay_minutes AS "delayMinutes",
        buses.capacity AS "totalSeats",
        staff_users.name AS "driverName",
        COUNT(seats.id)::int AS "seatCount",
        COUNT(seats.id) FILTER (WHERE seats.available)::int AS "availableSeats"
      FROM routes
      LEFT JOIN buses ON buses.id = routes.bus_id
      LEFT JOIN staff_users ON staff_users.id = routes.driver_id
      LEFT JOIN seats ON seats.route_id = routes.id
      GROUP BY routes.id, buses.capacity, staff_users.name
      ORDER BY routes.date ASC, routes.departure ASC;
    `;
    return Response.json(rows);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to load routes', 500);
  }
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const input = parseRouteInput(await req.json());
    await ensureAuthTables();
    await ensureBookingTables();
    await validateDriver(input.driverId);
    const bus = await getBus(input.busId);
    const amenities = input.amenities.length > 0 ? input.amenities : (bus.amenities ?? []);
    const routeId = `route-${randomUUID().slice(0, 8)}`;
    const seats = buildSeats(Number(bus.capacity), input.price);

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO routes (
          id, bus_id, origin, destination, date, departure, arrival, duration,
          bus_name, price, amenities, status, driver_id, delay_minutes
        ) VALUES (
          ${routeId}, ${input.busId}, ${input.origin}, ${input.destination}, ${input.date},
          ${input.departure}, ${input.arrival}, ${input.duration}, ${bus.name}, ${input.price},
          ${tx.json(amenities)}, ${input.status}, ${input.driverId}, ${input.delayMinutes}
        );
      `;
      for (const seat of seats) {
        await tx`
          INSERT INTO seats (id, route_id, label, type, available, price)
          VALUES (${seat.id}, ${routeId}, ${seat.label}, ${seat.type}, true, ${seat.price});
        `;
      }
    });

    return Response.json({ id: routeId }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to create route', 500);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) return jsonError('Route ID is required.');

    const input = parseRouteInput(body);
    await ensureAuthTables();
    await ensureBookingTables();
    await validateDriver(input.driverId);
    const bus = await getBus(input.busId);
    const amenities = input.amenities.length > 0 ? input.amenities : (bus.amenities ?? []);

    await sql.begin(async (tx) => {
      const existing = await tx`SELECT bus_id, (SELECT COUNT(*) FROM bookings WHERE route_id = ${id})::int AS booking_count FROM routes WHERE id = ${id} FOR UPDATE;`;
      if (!existing[0]) throw new Error('Route not found.');
      const seatCount = await tx`SELECT COUNT(*)::int AS count FROM seats WHERE route_id = ${id};`;
      if (Number(existing[0].booking_count) > 0 && Number(seatCount[0].count) !== Number(bus.capacity)) {
        throw new Error('Bus capacity cannot change after this route has bookings.');
      }

      await tx`
        UPDATE routes SET
          bus_id = ${input.busId}, origin = ${input.origin}, destination = ${input.destination},
          date = ${input.date}, departure = ${input.departure}, arrival = ${input.arrival},
          duration = ${input.duration}, bus_name = ${bus.name}, price = ${input.price},
          amenities = ${tx.json(amenities)}, status = ${input.status}, driver_id = ${input.driverId}, delay_minutes = ${input.delayMinutes},
          updated_at = now()
        WHERE id = ${id};
      `;

      if (Number(existing[0].booking_count) === 0) {
        await tx`DELETE FROM seats WHERE route_id = ${id};`;
        for (const seat of buildSeats(Number(bus.capacity), input.price)) {
          await tx`
            INSERT INTO seats (id, route_id, label, type, available, price)
            VALUES (${seat.id}, ${id}, ${seat.label}, ${seat.type}, true, ${seat.price});
          `;
        }
      } else {
        await tx`UPDATE seats SET price = ${input.price} WHERE route_id = ${id} AND available = true;`;
      }
    });

    return Response.json({ id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to update route', 500);
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const id = new URL(req.url).searchParams.get('id')?.trim();
    if (!id) return jsonError('Route ID is required.');
    await ensureBookingTables();

    await sql.begin(async (tx) => {
      const bookings = await tx`SELECT COUNT(*)::int AS count FROM bookings WHERE route_id = ${id};`;
      if (Number(bookings[0]?.count ?? 0) > 0) {
        throw new Error('Routes with bookings cannot be deleted. Cancel the route instead.');
      }
      await tx`DELETE FROM seats WHERE route_id = ${id};`;
      const deleted = await tx`DELETE FROM routes WHERE id = ${id} RETURNING id;`;
      if (!deleted[0]) throw new Error('Route not found.');
    });

    return Response.json({ success: true, id });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to delete route', 500);
  }
}
