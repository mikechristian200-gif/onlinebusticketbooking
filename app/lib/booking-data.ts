import { Booking, BusRoute, Seat } from './definitions';
import { sql } from './db';

const DEFAULT_SEARCH_LIMIT = 20;

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function normalizeDateValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const match = value.trim().match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? value.trim() : new Date(value).toISOString().slice(0, 10);
  }
  return '';
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
    busName: row.bus_name ?? 'Unassigned bus',
    price: Number(row.price),
    amenities: row.amenities ?? [],
    status: row.status ?? 'scheduled',
    driverId: row.driver_id ?? null,
    driverName: row.driver_name ?? null,
    seats: Array.isArray(row.seats) ? row.seats.map((seat: any) => ({
      id: seat.id,
      label: seat.label,
      type: seat.type,
      available: seat.available,
      price: Number(seat.price),
    })) : [],
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
      busName: row.bus_name ?? 'Unassigned bus',
      price: Number(row.route_price),
      amenities: row.amenities ?? [],
    },
    seats: Array.isArray(row.seat_details) ? row.seat_details.map((seat: any) => ({
      id: seat.id,
      label: seat.label,
      type: seat.type,
      available: seat.available,
      price: Number(seat.price),
    })) : [],
  };
}

const routeSeatJson = (scheduleAlias: string) => `COALESCE((
  SELECT json_agg(json_build_object(
    'id', seat_rows.id,
    'label', seat_rows.label,
    'type', seat_rows.type,
    'available', seat_rows.available,
    'price', seat_rows.price
  ) ORDER BY seat_rows.id)
  FROM seats seat_rows WHERE seat_rows.schedule_id = ${scheduleAlias}.id
), '[]'::json) AS seats`;

const bookingSeatJson = `COALESCE((
  SELECT json_agg(json_build_object(
    'id', selected_seats.id,
    'label', selected_seats.label,
    'type', selected_seats.type,
    'available', selected_seats.available,
    'price', selected_seats.price
  ) ORDER BY selected_seats.id)
  FROM booking_seats selected_booking_seats
  JOIN seats selected_seats ON selected_seats.schedule_id = bookings.schedule_id
    AND selected_seats.id = selected_booking_seats.seat_id
  WHERE selected_booking_seats.booking_id = bookings.id
), '[]'::json) AS seat_details`;

export async function getBusRoutes(searchParams?: { from?: string | string[]; to?: string | string[]; date?: string | string[] }) {
  const from = normalizeSearchParam(searchParams?.from).trim().toLowerCase();
  const to = normalizeSearchParam(searchParams?.to).trim().toLowerCase();
  const date = normalizeDateValue(normalizeSearchParam(searchParams?.date).trim());
  const select = `
    SELECT s.id, s.bus_id, r.origin, r.destination, s.travel_date AS date,
      s.departure, s.arrival, s.duration, b.name AS bus_name, s.price,
      s.amenities, s.status, s.driver_id,
      ${routeSeatJson('s')}
    FROM schedules s
    JOIN routes r ON r.id = s.route_id
    LEFT JOIN buses b ON b.id = s.bus_id
    WHERE ($1 = '' OR LOWER(r.origin) LIKE $2)
      AND ($3 = '' OR LOWER(r.destination) LIKE $4)
      AND s.status NOT IN ('cancelled', 'completed')
      ${date ? 'AND s.travel_date = $5::date' : ''}
    ORDER BY s.travel_date ASC, s.departure ASC
    LIMIT $${date ? 6 : 5}`;
  const params = date ? [from, `%${from}%`, to, `%${to}%`, date, DEFAULT_SEARCH_LIMIT] : [from, `%${from}%`, to, `%${to}%`, DEFAULT_SEARCH_LIMIT];
  const rows = await sql.unsafe(select, params);
  return rows.map(serializeRouteRow);
}

export async function getBusRouteById(id: string) {
  const rows = await sql`
    SELECT s.id, s.bus_id, r.origin, r.destination, s.travel_date AS date,
      s.departure, s.arrival, s.duration, b.name AS bus_name, s.price,
      s.amenities, s.status, s.driver_id,
      COALESCE((SELECT json_agg(json_build_object('id', seats.id, 'label', seats.label, 'type', seats.type, 'available', seats.available, 'price', seats.price) ORDER BY seats.id) FROM seats WHERE seats.schedule_id = s.id), '[]'::json) AS seats
    FROM schedules s
    JOIN routes r ON r.id = s.route_id
    LEFT JOIN buses b ON b.id = s.bus_id
    WHERE s.id = ${id};
  `;
  return rows[0] ? serializeRouteRow(rows[0]) : null;
}

const bookingSelect = `
  SELECT bookings.id, bookings.reference, bookings.schedule_id AS route_id,
    bookings.customer_id, bookings.passenger_name, bookings.passenger_email,
    bookings.passenger_phone, bookings.total_amount, bookings.payment_method,
    bookings.status, bookings.created_at, r.origin, r.destination,
    s.travel_date AS date, s.departure, s.arrival, s.duration,
    b.name AS bus_name, s.price AS route_price, s.amenities,
    ${bookingSeatJson}
  FROM bookings
  JOIN schedules s ON s.id = bookings.schedule_id
  JOIN routes r ON r.id = s.route_id
  LEFT JOIN buses b ON b.id = s.bus_id`;

export async function getBookingByReference(reference: string) {
  const rows = await sql.unsafe(`${bookingSelect} WHERE bookings.reference = $1 LIMIT 1`, [reference]);
  return rows[0] ? serializeBookingRow(rows[0]) : null;
}

export async function getBookings() {
  const rows = await sql.unsafe(`${bookingSelect} ORDER BY bookings.created_at DESC LIMIT 100`);
  return rows.map(serializeBookingRow);
}

export async function getAdminMetrics() {
  const rows = await sql`
    SELECT
      (SELECT COALESCE(SUM(total_amount), 0)::int FROM bookings WHERE status <> 'cancelled') AS sales,
      (SELECT COUNT(*)::int FROM bookings WHERE status <> 'cancelled') AS bookings,
      (SELECT COUNT(*)::int FROM schedules WHERE travel_date >= CURRENT_DATE AND status IN ('scheduled', 'boarding')) AS active_routes,
      (SELECT COUNT(*)::int FROM schedules WHERE travel_date = CURRENT_DATE AND status = 'cancelled') AS cancelled_today;
  `;
  return rows[0];
}

export async function getManagerMetrics() {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM schedules WHERE travel_date = CURRENT_DATE AND status IN ('boarding', 'departed')) AS fleet_on_route,
      (SELECT COUNT(*)::int FROM bookings b JOIN schedules s ON s.id = b.schedule_id WHERE b.created_at::date = CURRENT_DATE AND b.status <> 'cancelled') AS tickets_today,
      (SELECT COUNT(*)::int FROM schedules WHERE travel_date = CURRENT_DATE AND delay_minutes > 0) AS late_departures;
  `;
  return rows[0];
}

export async function getDriverTrip(driverId: string) {
  const rows = await sql`
    SELECT s.id, r.origin, r.destination, s.travel_date AS date, s.departure, s.arrival,
      s.status, b.name AS bus_name, COUNT(seats.id)::int AS total_seats,
      COUNT(seats.id) FILTER (WHERE seats.available = false)::int AS occupied_seats
    FROM schedules s
    JOIN routes r ON r.id = s.route_id
    LEFT JOIN buses b ON b.id = s.bus_id
    LEFT JOIN seats ON seats.schedule_id = s.id
    WHERE s.driver_id = ${driverId} AND s.travel_date >= CURRENT_DATE AND s.status <> 'cancelled'
    GROUP BY s.id, r.id, b.name
    ORDER BY s.travel_date ASC, s.departure ASC
    LIMIT 1;
  `;
  return rows[0] ?? null;
}

export async function getCustomerBookings(customerId: string) {
  const rows = await sql.unsafe(`${bookingSelect} WHERE bookings.customer_id = $1 ORDER BY bookings.created_at DESC LIMIT 100`, [customerId]);
  return rows.map(serializeBookingRow);
}
