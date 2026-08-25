import { randomUUID } from 'crypto';
import { sql } from '@/app/lib/db';
import { getCurrentCustomer, getCurrentUser } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return Response.json({ error: 'Please sign in before booking.' }, { status: 401 });

    const body = await req.json();
    const { routeId, seatIds, passengerName, passengerEmail, passengerPhone, paymentMethod } = body;
    const normalizedSeatIds = Array.isArray(seatIds)
      ? [...new Set(seatIds.filter((seatId): seatId is string => typeof seatId === 'string' && seatId.trim() !== ''))]
      : [];
    if (typeof routeId !== 'string' || normalizedSeatIds.length === 0 || typeof passengerName !== 'string' || !passengerName.trim() || typeof passengerEmail !== 'string' || !passengerEmail.trim()) {
      return Response.json({ error: 'Missing booking information' }, { status: 400 });
    }

    const booking = await sql.begin(async (tx) => {
      const seatRows = await tx`
        SELECT id, schedule_id, available, price
        FROM seats WHERE schedule_id = ${routeId} AND id = ANY(${normalizedSeatIds}) FOR UPDATE;
      `;
      const scheduleRows = await tx`SELECT status FROM schedules WHERE id = ${routeId} LIMIT 1;`;
      if (!scheduleRows[0]) throw new Error('Route not found');
      if (!['scheduled', 'boarding'].includes(scheduleRows[0].status)) throw new Error('This route is no longer accepting bookings');
      if (seatRows.length !== normalizedSeatIds.length) throw new Error('One or more seats not found');
      const unavailableSeat = seatRows.find((seat: any) => !seat.available);
      if (unavailableSeat) throw new Error(`Seat ${unavailableSeat.id} is no longer available`);

      const totalAmount = seatRows.reduce((total: number, seat: any) => total + Number(seat.price), 0);
      const bookingReference = `GE-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
      const payment = typeof paymentMethod === 'string' && paymentMethod.trim() ? paymentMethod.trim() : 'cash';
      const bookingRows = await tx`
        INSERT INTO bookings (reference, schedule_id, customer_id, passenger_name, passenger_email, passenger_phone, total_amount, payment_method, status)
        VALUES (${bookingReference}, ${routeId}, ${customer.id}, ${passengerName.trim()}, ${passengerEmail.trim()},
          ${typeof passengerPhone === 'string' && passengerPhone.trim() ? passengerPhone.trim() : null}, ${totalAmount}, ${payment}, 'confirmed')
        RETURNING id, reference;
      `;
      const bookingId = bookingRows[0].id;

      for (const seat of seatRows) {
        await tx`INSERT INTO booking_seats (booking_id, schedule_id, seat_id, fare_amount) VALUES (${bookingId}, ${routeId}, ${seat.id}, ${seat.price});`;
      }
      await tx`UPDATE seats SET available = false WHERE schedule_id = ${routeId} AND id = ANY(${normalizedSeatIds});`;
      await tx`INSERT INTO payments (booking_id, amount, method, status) VALUES (${bookingId}, ${totalAmount}, ${payment}, 'pending');`;
      await tx`INSERT INTO notifications (customer_id, booking_id, channel, notification_type, recipient, subject, body) VALUES (${customer.id}, ${bookingId}, 'email', 'booking_confirmation', ${passengerEmail.trim()}, 'Booking confirmation', ${`Your booking ${bookingReference} has been confirmed.`});`;
      await tx`INSERT INTO audit_logs (actor_customer_id, action, entity_type, entity_id, metadata) VALUES (${customer.id}, 'booking.created', 'booking', ${String(bookingId)}, ${tx.json({ reference: bookingReference, seats: normalizedSeatIds })});`;
      return { reference: bookingReference, totalAmount };
    });

    return Response.json(booking, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('no longer available') || message.includes('no longer accepting') ? 409 : message === 'Route not found' ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') return Response.json({ error: 'Staff access required' }, { status: 403 });

    const body = await req.json();
    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    const status = body.status;
    if (!reference || !['confirmed', 'cancelled', 'completed'].includes(status)) return Response.json({ error: 'Reference and a valid status are required.' }, { status: 400 });

    const result = await sql.begin(async (tx) => {
      const bookingRows = await tx`SELECT id, schedule_id, status FROM bookings WHERE reference = ${reference} FOR UPDATE;`;
      const booking = bookingRows[0];
      if (!booking) throw new Error('Booking not found');
      if (booking.status === 'cancelled' && status !== 'cancelled') throw new Error('Cancelled bookings cannot be reopened.');

      if (status === 'cancelled' && booking.status !== 'cancelled') {
        await tx`UPDATE booking_seats SET released_at = now() WHERE booking_id = ${booking.id} AND released_at IS NULL;`;
        await tx`UPDATE seats SET available = true WHERE schedule_id = ${booking.schedule_id} AND EXISTS (SELECT 1 FROM booking_seats bs WHERE bs.booking_id = ${booking.id} AND bs.seat_id = seats.id);`;
        await tx`INSERT INTO cancellations (booking_id, cancelled_by_staff_id, reason, status, completed_at) VALUES (${booking.id}, ${user.id}, ${typeof body.reason === 'string' ? body.reason.trim() : null}, 'completed', now());`;
      }
      const updated = await tx`UPDATE bookings SET status = ${status}, updated_at = now() WHERE id = ${booking.id} RETURNING reference, status;`;
      await tx`INSERT INTO audit_logs (actor_staff_id, action, entity_type, entity_id, metadata) VALUES (${user.id}, ${`booking.${status}`}, 'booking', ${String(booking.id)}, ${tx.json({ reference })});`;
      return updated[0];
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update booking';
    return Response.json({ error: message }, { status: message === 'Booking not found' ? 404 : 500 });
  }
}
