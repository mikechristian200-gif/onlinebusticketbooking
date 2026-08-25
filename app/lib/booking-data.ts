import { Booking, BusRoute, Seat } from './definitions';
import { ensureBookingTables, sql } from './db';

const DEFAULT_SEARCH_LIMIT = 20;

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function normalizeDateValue(value: unknown) {
  if (value instanceof Date) {
    const time = value.getTime();
    if (!Number.isNaN(time)) {
      return value.toISOString().slice(0, 10);
    }
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    const match = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) {
      return match[0];
    }

    const time = new Date(trimmed).getTime();
    if (!Number.isNaN(time)) {
      return new Date(trimmed).toISOString().slice(0, 10);
    }

    return trimmed;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const time = new Date(value).getTime();
    if (!Number.isNaN(time)) {
      return new Date(value).toISOString().slice(0, 10);
    }
  }

  return String(value ?? '');
}

function serializeRouteRow(row: any): BusRoute {
  return {
    id: row.id,
    busId: row.bus_id ?? null,
    origin: row.origin,
    destination: row.destination,
    date: normalizeDateValue(row.date),
    departure: row.departure,
    arrival: row.arrival,
    duration: row.duration,
    busName: row.bus_name,
    price: Number(row.price),
    amenities: row.amenities ?? [],
    status: row.status ?? 'scheduled',
    driverId: row.driver_id ?? null,
    driverName: row.driver_name ?? null,
    seats: Array.isArray(row.seats)
      ? row.seats.map((seat: any) => ({
          id: seat.id,
          label: seat.label,
          type: seat.type,
          available: seat.available,
          price: Number(seat.price),
        }))
      : [],
  };
}

function serializeBookingRow(row: any): Booking {
  return {
    id: Number(row.id),
    reference: row.reference,
    routeId: row.route_id,
    customerId: row.customer_id ?? null,
    passengerName: row.passenger_name,
    passengerEmail: row.passenger_email,
    passengerPhone: row.passenger_phone,
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    route: {
      id: row.route_id,
      origin: row.origin,
      destination: row.destination,
      date: normalizeDateValue(row.date),
      departure: row.departure,
      arrival: row.arrival,
      duration: row.duration,
      busName: row.bus_name,
      price: Number(row.route_price),
      amenities: row.amenities ?? [],
    },
    seats: Array.isArray(row.seat_details)
      ? row.seat_details.map((seat: any) => ({
          id: seat.id,
          label: seat.label,
          type: seat.type,
          available: seat.available,
          price: Number(seat.price),
        }))
      : [],
  };
}

export async function getBusRoutes(searchParams?: {
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
}) {
  await ensureBookingTables();
  const from = normalizeSearchParam(searchParams?.from).trim().toLowerCase();
  const to = normalizeSearchParam(searchParams?.to).trim().toLowerCase();
  const rawDate = normalizeSearchParam(searchParams?.date).trim();
  const date = normalizeDateValue(rawDate);

  const rows = date
    ? await sql`
      SELECT
        routes.id,
        routes.bus_id,
        routes.origin,
        routes.destination,
        routes.date,
        routes.departure,
        routes.arrival,
        routes.duration,
        routes.bus_name,
        routes.price,
        routes.amenities,
        routes.status,
        routes.driver_id,
        COALESCE(
          json_agg(json_build_object(
            'id', seats.id,
            'label', seats.label,
            'type', seats.type,
            'available', seats.available,
            'price', seats.price
          ) ORDER BY seats.id) FILTER (WHERE seats.id IS NOT NULL), '[]'
        ) AS seats
      FROM routes
      LEFT JOIN seats ON seats.route_id = routes.id
      WHERE
        (${from} = '' OR LOWER(routes.origin) LIKE ${`%${from}%`})
        AND (${to} = '' OR LOWER(routes.destination) LIKE ${`%${to}%`})
        AND routes.status NOT IN ('cancelled', 'completed')
        AND routes.date = ${date}::date
      GROUP BY routes.id
      ORDER BY routes.date ASC
      LIMIT ${DEFAULT_SEARCH_LIMIT};
    `
    : await sql`
      SELECT
        routes.id,
        routes.bus_id,
        routes.origin,
        routes.destination,
        routes.date,
        routes.departure,
        routes.arrival,
        routes.duration,
        routes.bus_name,
        routes.price,
        routes.amenities,
        routes.status,
        routes.driver_id,
        COALESCE(
          json_agg(json_build_object(
            'id', seats.id,
            'label', seats.label,
            'type', seats.type,
            'available', seats.available,
            'price', seats.price
          ) ORDER BY seats.id) FILTER (WHERE seats.id IS NOT NULL), '[]'
        ) AS seats
      FROM routes
      LEFT JOIN seats ON seats.route_id = routes.id
      WHERE
        (${from} = '' OR LOWER(routes.origin) LIKE ${`%${from}%`})
        AND (${to} = '' OR LOWER(routes.destination) LIKE ${`%${to}%`})
        AND routes.status NOT IN ('cancelled', 'completed')
      GROUP BY routes.id
      ORDER BY routes.date ASC
      LIMIT ${DEFAULT_SEARCH_LIMIT};
    `;

  return rows.map(serializeRouteRow);
}

export async function getBusRouteById(id: string) {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      routes.id,
      routes.bus_id,
      routes.origin,
      routes.destination,
      routes.date,
      routes.departure,
      routes.arrival,
      routes.duration,
      routes.bus_name,
      routes.price,
      routes.amenities,
      routes.status,
      routes.driver_id,
      COALESCE(
        json_agg(json_build_object(
          'id', seats.id,
          'label', seats.label,
          'type', seats.type,
          'available', seats.available,
          'price', seats.price
        ) ORDER BY seats.id) FILTER (WHERE seats.id IS NOT NULL), '[]'
      ) AS seats
    FROM routes
    LEFT JOIN seats ON seats.route_id = routes.id
    WHERE routes.id = ${id}
    GROUP BY routes.id;
  `;

  if (!rows[0]) {
    return null;
  }

  return serializeRouteRow(rows[0]);
}

export async function getBookingByReference(reference: string) {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      bookings.id,
      bookings.reference,
      bookings.route_id,
      bookings.customer_id,
      bookings.passenger_name,
      bookings.passenger_email,
      bookings.passenger_phone,
      bookings.seats,
      bookings.total_amount,
      bookings.payment_method,
      bookings.status,
      bookings.created_at,
      routes.origin,
      routes.destination,
      routes.date,
      routes.departure,
      routes.arrival,
      routes.duration,
      routes.bus_name,
      routes.price AS route_price,
      routes.amenities,
      COALESCE(
        json_agg(json_build_object(
          'id', selected_seats.id,
          'label', selected_seats.label,
          'type', selected_seats.type,
          'available', selected_seats.available,
          'price', selected_seats.price
        ) ORDER BY selected_seats.id) FILTER (WHERE selected_seats.id IS NOT NULL), '[]'
      ) AS seat_details
    FROM bookings
    JOIN routes ON routes.id = bookings.route_id
    LEFT JOIN LATERAL jsonb_array_elements_text(bookings.seats) booked_seat_ids(id) ON true
    LEFT JOIN seats selected_seats
      ON selected_seats.route_id = bookings.route_id
      AND selected_seats.id = booked_seat_ids.id
    WHERE bookings.reference = ${reference}
    GROUP BY bookings.id, routes.id;
  `;

  return rows[0] ? serializeBookingRow(rows[0]) : null;
}

export async function getBookings() {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      bookings.id,
      bookings.reference,
      bookings.route_id,
      bookings.customer_id,
      bookings.passenger_name,
      bookings.passenger_email,
      bookings.passenger_phone,
      bookings.seats,
      bookings.total_amount,
      bookings.payment_method,
      bookings.status,
      bookings.created_at,
      routes.origin,
      routes.destination,
      routes.date,
      routes.departure,
      routes.arrival,
      routes.duration,
      routes.bus_name,
      routes.price AS route_price,
      routes.amenities,
      COALESCE(
        json_agg(json_build_object(
          'id', selected_seats.id,
          'label', selected_seats.label,
          'type', selected_seats.type,
          'available', selected_seats.available,
          'price', selected_seats.price
        ) ORDER BY selected_seats.id) FILTER (WHERE selected_seats.id IS NOT NULL), '[]'
      ) AS seat_details
    FROM bookings
    JOIN routes ON routes.id = bookings.route_id
    LEFT JOIN LATERAL jsonb_array_elements_text(bookings.seats) booked_seat_ids(id) ON true
    LEFT JOIN seats selected_seats
      ON selected_seats.route_id = bookings.route_id
      AND selected_seats.id = booked_seat_ids.id
    GROUP BY bookings.id, routes.id
    ORDER BY bookings.created_at DESC
    LIMIT 100;
  `;

  return rows.map(serializeBookingRow);
}

export async function getAdminMetrics() {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      (SELECT COALESCE(SUM(total_amount), 0)::int FROM bookings WHERE status <> 'cancelled') AS sales,
      (SELECT COUNT(*)::int FROM bookings WHERE status <> 'cancelled') AS bookings,
      (SELECT COUNT(*)::int FROM routes WHERE date >= CURRENT_DATE AND status IN ('scheduled', 'boarding')) AS active_routes,
      (SELECT COUNT(*)::int FROM routes WHERE date = CURRENT_DATE AND status = 'cancelled') AS cancelled_today;
  `;
  return rows[0];
}

export async function getManagerMetrics() {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM routes WHERE date = CURRENT_DATE AND status IN ('boarding', 'departed')) AS fleet_on_route,
      (SELECT COUNT(*)::int FROM bookings b JOIN routes r ON r.id = b.route_id WHERE b.created_at::date = CURRENT_DATE AND b.status <> 'cancelled') AS tickets_today,
      (SELECT COUNT(*)::int FROM routes WHERE date = CURRENT_DATE AND delay_minutes > 0) AS late_departures;
  `;
  return rows[0];
}

export async function getDriverTrip(driverId: string) {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      routes.id,
      routes.origin,
      routes.destination,
      routes.date,
      routes.departure,
      routes.arrival,
      routes.status,
      routes.bus_name,
      COUNT(seats.id)::int AS total_seats,
      COUNT(seats.id) FILTER (WHERE seats.available = false)::int AS occupied_seats
    FROM routes
    LEFT JOIN seats ON seats.route_id = routes.id
    WHERE routes.driver_id = ${driverId}
      AND routes.date >= CURRENT_DATE
      AND routes.status <> 'cancelled'
    GROUP BY routes.id
    ORDER BY routes.date ASC, routes.departure ASC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function getCustomerBookings(customerId: string) {
  await ensureBookingTables();
  const rows = await sql`
    SELECT
      bookings.id,
      bookings.reference,
      bookings.route_id,
      bookings.customer_id,
      bookings.passenger_name,
      bookings.passenger_email,
      bookings.passenger_phone,
      bookings.seats,
      bookings.total_amount,
      bookings.payment_method,
      bookings.status,
      bookings.created_at,
      routes.origin,
      routes.destination,
      routes.date,
      routes.departure,
      routes.arrival,
      routes.duration,
      routes.bus_name,
      routes.price AS route_price,
      routes.amenities,
      COALESCE(
        json_agg(json_build_object(
          'id', selected_seats.id,
          'label', selected_seats.label,
          'type', selected_seats.type,
          'available', selected_seats.available,
          'price', selected_seats.price
        ) ORDER BY selected_seats.id) FILTER (WHERE selected_seats.id IS NOT NULL), '[]'
      ) AS seat_details
    FROM bookings
    JOIN routes ON routes.id = bookings.route_id
    LEFT JOIN LATERAL jsonb_array_elements_text(bookings.seats) booked_seat_ids(id) ON true
    LEFT JOIN seats selected_seats
      ON selected_seats.route_id = bookings.route_id
      AND selected_seats.id = booked_seat_ids.id
    WHERE bookings.customer_id = ${customerId}
    GROUP BY bookings.id, routes.id
    ORDER BY bookings.created_at DESC
    LIMIT 100;
  `;
  return rows.map(serializeBookingRow);
}
