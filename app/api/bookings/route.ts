import { ensureBookingTables, sql } from '@/app/lib/db';
import { getCurrentCustomer } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const customer = await getCurrentCustomer();
    if (!customer) {
      return Response.json({ error: 'Please sign in before booking.' }, { status: 401 });
    }
    const body = await req.json();
    const { routeId, seatIds, passengerName, passengerEmail, passengerPhone, paymentMethod } = body;
    const normalizedSeatIds = Array.isArray(seatIds)
      ? [...new Set(seatIds.filter((seatId): seatId is string => typeof seatId === 'string' && seatId.trim() !== ''))]
      : [];

    if (
      typeof routeId !== 'string' ||
      normalizedSeatIds.length === 0 ||
      typeof passengerName !== 'string' ||
      passengerName.trim() === '' ||
      typeof passengerEmail !== 'string' ||
      passengerEmail.trim() === ''
    ) {
      return new Response(JSON.stringify({ error: 'Missing booking information' }), {
        status: 400,
      });
    }

    const booking = await sql.begin(async (tx) => {
      await ensureBookingTables(tx);

      const seatRows = await tx`
        SELECT id, route_id, available, price
        FROM seats
        WHERE route_id = ${routeId} AND id = ANY(${normalizedSeatIds})
        FOR UPDATE;
      `;

      const routeRows = await tx`
        SELECT status FROM routes WHERE id = ${routeId} LIMIT 1;
      `;
      if (!routeRows[0]) {
        throw new Error('Route not found');
      }
      if (!['scheduled', 'boarding'].includes(routeRows[0].status)) {
        throw new Error('This route is no longer accepting bookings');
      }

      if (seatRows.length !== normalizedSeatIds.length) {
        throw new Error('One or more seats not found');
      }

      const unavailableSeat = seatRows.find((seat: any) => !seat.available);
      if (unavailableSeat) {
        throw new Error(`Seat ${unavailableSeat.id} is no longer available`);
      }

      const totalAmount = seatRows.reduce((total: number, seat: any) => total + Number(seat.price), 0);

      await tx`
        UPDATE seats
        SET available = false
        WHERE route_id = ${routeId} AND id = ANY(${normalizedSeatIds});
      `;

      const bookingReference = `GE-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

      await tx`
        INSERT INTO bookings (
          reference,
          route_id,
          customer_id,
          passenger_name,
          passenger_email,
          passenger_phone,
          seats,
          total_amount,
          payment_method,
          status
        )
        VALUES (
          ${bookingReference},
          ${routeId},
          ${customer.id},
          ${passengerName.trim()},
          ${passengerEmail.trim()},
          ${typeof passengerPhone === 'string' && passengerPhone.trim() ? passengerPhone.trim() : null},
          ${sql.json(normalizedSeatIds)},
          ${totalAmount},
          ${typeof paymentMethod === 'string' && paymentMethod.trim() ? paymentMethod.trim() : 'cash'},
          'confirmed'
        )
      `;

      return { reference: bookingReference, totalAmount };
    });

    return Response.json(booking, {
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('no longer available') || message.includes('no longer accepting') ? 409 : message === 'Route not found' ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const { getCurrentUser } = await import('@/app/lib/auth');
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'manager') {
      return Response.json({ error: 'Staff access required' }, { status: 403 });
    }

    const body = await req.json();
    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    const status = body.status;
    if (!reference || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return Response.json({ error: 'Reference and a valid status are required.' }, { status: 400 });
    }

    await ensureBookingTables();
    const result = await sql.begin(async (tx) => {
      const bookingRows = await tx`
        SELECT id, route_id, seats, status
        FROM bookings
        WHERE reference = ${reference}
        FOR UPDATE;
      `;
      const booking = bookingRows[0];
      if (!booking) throw new Error('Booking not found');
      if (booking.status === 'cancelled' && status !== 'cancelled') {
        throw new Error('Cancelled bookings cannot be reopened.');
      }

      if (status === 'cancelled' && booking.status !== 'cancelled') {
        const seatIds = Array.isArray(booking.seats) ? booking.seats : [];
        await tx`
          UPDATE seats
          SET available = true
          WHERE route_id = ${booking.route_id} AND id = ANY(${seatIds});
        `;
      }
      const updated = await tx`
        UPDATE bookings SET status = ${status}
        WHERE id = ${booking.id}
        RETURNING reference, status;
      `;
      return updated[0];
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update booking';
    return Response.json({ error: message }, { status: message === 'Booking not found' ? 404 : 500 });
  }
}
