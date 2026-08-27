import crypto from 'crypto';
import { sql } from '@/app/lib/db';

function isValidSignature(payload: string, signature: string) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const actual = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!isValidSignature(rawBody, request.headers.get('x-payment-signature') ?? '')) {
    return Response.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody) as {
      bookingReference?: unknown;
      providerReference?: unknown;
      status?: unknown;
      amount?: unknown;
      currency?: unknown;
      method?: unknown;
      provider?: unknown;
    };
    const bookingReference = typeof body.bookingReference === 'string' ? body.bookingReference.trim() : '';
    const providerReference = typeof body.providerReference === 'string' ? body.providerReference.trim() : '';
    const status = body.status === 'paid' ? 'paid' : body.status === 'failed' ? 'failed' : '';
    const amount = Number(body.amount);
    if (!bookingReference || !providerReference || !status || !Number.isInteger(amount) || amount < 0) {
      return Response.json({ error: 'Invalid payment event' }, { status: 400 });
    }

    const result = await sql.begin(async (tx) => {
      const bookingRows = await tx`SELECT id, total_amount, customer_id, passenger_email FROM bookings WHERE reference = ${bookingReference} FOR UPDATE;`;
      if (!bookingRows[0]) throw new Error('Booking not found');
      if (Number(bookingRows[0].total_amount) !== amount) throw new Error('Payment amount does not match booking');

      const provider = typeof body.provider === 'string' ? body.provider : 'momo';
      const existingPayment = await tx`SELECT id, booking_id, amount, status FROM payments WHERE provider = ${provider} AND provider_reference = ${providerReference} LIMIT 1;`;
      if (existingPayment[0] && (String(existingPayment[0].booking_id) !== String(bookingRows[0].id) || Number(existingPayment[0].amount) !== amount)) {
        throw new Error('Payment reference is already linked to another booking');
      }
      const paymentRows = existingPayment[0]
        ? await tx`UPDATE payments SET status = ${status}, paid_at = CASE WHEN ${status} = 'paid' THEN now() ELSE NULL END, updated_at = now() WHERE id = ${existingPayment[0].id} RETURNING status;`
        : await tx`INSERT INTO payments (booking_id, amount, currency, method, status, provider, provider_reference, paid_at) VALUES (${bookingRows[0].id}, ${amount}, ${typeof body.currency === 'string' ? body.currency : 'XAF'}, ${typeof body.method === 'string' ? body.method : 'mobile-money'}, ${status}, ${provider}, ${providerReference}, CASE WHEN ${status} = 'paid' THEN now() ELSE NULL END) RETURNING status;`;
      if (status === 'paid') {
        const confirmed = await tx`UPDATE bookings SET status = 'confirmed', updated_at = now() WHERE id = ${bookingRows[0].id} AND status = 'pending' RETURNING id;`;
        if (confirmed[0]) {
          await tx`INSERT INTO notifications (customer_id, booking_id, channel, notification_type, recipient, subject, body) VALUES (${bookingRows[0].customer_id}, ${bookingRows[0].id}, 'email', 'payment_confirmed', ${bookingRows[0].passenger_email}, 'Payment confirmed', ${`Payment for booking ${bookingReference} has been confirmed.`});`;
        }
      }
      await tx`INSERT INTO audit_logs (action, entity_type, entity_id, metadata) VALUES (${`payment.${status}`}, 'payment', ${String(bookingRows[0].id)}, ${tx.json({ bookingReference, providerReference, amount })});`;
      return paymentRows[0];
    });

    return Response.json({ received: true, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment webhook failed';
    return Response.json({ error: message }, { status: message === 'Booking not found' ? 404 : 400 });
  }
}