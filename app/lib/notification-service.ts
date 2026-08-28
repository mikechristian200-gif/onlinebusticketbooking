import nodemailer from 'nodemailer';
import { sql } from '@/app/lib/db';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) throw new Error('Gmail SMTP is not configured.');

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: { user, pass: password },
  });
}

export async function sendPendingEmails() {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) throw new Error('SMTP_FROM or SMTP_USER is required.');

  const pending = await sql`
    SELECT id, recipient, subject, body
    FROM notifications
    WHERE status = 'pending' AND channel = 'email'
    ORDER BY created_at ASC
    LIMIT 50;
  `;

  let sent = 0;
  let failed = 0;
  for (const notification of pending) {
    try {
      await transporter.sendMail({
        from,
        to: notification.recipient,
        subject: notification.subject || 'Golden Express notification',
        text: notification.body,
      });
      await sql`UPDATE notifications SET status = 'sent', sent_at = now() WHERE id = ${notification.id} AND status = 'pending';`;
      sent += 1;
    } catch {
      await sql`UPDATE notifications SET status = 'failed' WHERE id = ${notification.id} AND status = 'pending';`;
      failed += 1;
    }
  }

  return { claimed: pending.length, sent, failed };
}

export async function queueDepartureReminders() {
  const eligible = await sql`
    SELECT b.id AS booking_id, b.customer_id, b.reference, b.passenger_name, b.passenger_email,
      r.origin, r.destination, s.departure,
      CASE
        WHEN (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '23 hours 55 minutes' AND now() + interval '24 hours 5 minutes' THEN '24h'
        ELSE '1h'
      END AS reminder_type
    FROM bookings b
    JOIN schedules s ON s.id = b.schedule_id
    JOIN routes r ON r.id = s.route_id
    WHERE b.status = 'confirmed'
      AND (
        (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '55 minutes' AND now() + interval '65 minutes'
        OR (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '23 hours 55 minutes' AND now() + interval '24 hours 5 minutes'
      );
  `;
  let queued = 0;
  for (const booking of eligible) {
    const lead = booking.reminder_type === '24h' ? 'tomorrow' : 'in about one hour';
    const body = `Hello ${booking.passenger_name}, your Golden Express trip ${booking.reference} from ${booking.origin} to ${booking.destination} departs ${lead} at ${booking.departure}. Please arrive early.`;
    const result = await sql`
      INSERT INTO notifications (customer_id, booking_id, channel, notification_type, recipient, subject, body)
      VALUES (${booking.customer_id}, ${booking.booking_id}, 'email', ${`departure_${booking.reminder_type}`}, ${booking.passenger_email}, ${`Trip reminder for ${booking.reference}`}, ${body})
      ON CONFLICT (booking_id, channel, notification_type) DO NOTHING
      RETURNING id;
    `;
    queued += result.length;
  }
  return { eligible: eligible.length, queued };
}
