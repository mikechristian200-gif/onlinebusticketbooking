import { sql } from '@/app/lib/db';
import nodemailer from 'nodemailer';

type Reminder = {
  bookingId: number;
  customerId: string | null;
  reference: string;
  passengerName: string;
  email: string;
  phone: string | null;
  origin: string;
  destination: string;
  departure: string;
  departureAt: Date;
  reminderType: '24h' | '1h';
};

function reminderText(reminder: Reminder) {
  const lead = reminder.reminderType === '24h' ? 'tomorrow' : 'in about one hour';
  return `Hello ${reminder.passengerName}, your Golden Express trip ${reminder.reference} from ${reminder.origin} to ${reminder.destination} departs ${lead} at ${reminder.departure}. Please arrive early.`;
}

async function sendEmail(to: string, subject: string, text: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || user;
  if (!host || !user || !password || !from) throw new Error('SMTP email provider is not configured.');
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass: password },
  });
  await transporter.sendMail({ from, to, subject, text });
}

export async function queueDepartureReminders() {
  const reminders = await sql<Reminder[]>`
    SELECT b.id AS "bookingId", b.customer_id AS "customerId", b.reference,
      b.passenger_name AS "passengerName", b.passenger_email AS email, b.passenger_phone AS phone,
      r.origin, r.destination, s.departure,
      (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) AS "departureAt",
      CASE
        WHEN (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '23 hours 55 minutes' AND now() + interval '24 hours 5 minutes' THEN '24h'
        ELSE '1h'
      END AS "reminderType"
    FROM bookings b
    JOIN schedules s ON s.id = b.schedule_id
    JOIN routes r ON r.id = s.route_id
    WHERE b.status = 'confirmed'
      AND (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '55 minutes' AND now() + interval '24 hours 5 minutes'
      AND ((s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '55 minutes' AND now() + interval '65 minutes'
        OR (s.travel_date + to_timestamp(s.departure, 'HH12:MI AM')::time) BETWEEN now() + interval '23 hours 55 minutes' AND now() + interval '24 hours 5 minutes')
  `;

  let queued = 0;
  for (const reminder of reminders) {
    const text = reminderText(reminder);
    const subject = `Trip reminder for ${reminder.reference}`;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const result = await sql`
        INSERT INTO notifications (customer_id, booking_id, channel, notification_type, recipient, subject, body)
        VALUES (${reminder.customerId}, ${reminder.bookingId}, 'email', ${`departure_${reminder.reminderType}`}, ${reminder.email}, ${subject}, ${text})
        ON CONFLICT (booking_id, channel, notification_type) DO NOTHING
        RETURNING id;
      `;
      queued += result.length;
    }
  }
  return { eligible: reminders.length, queued };
}

export async function deliverPendingReminders() {
  const pending = await sql`
    UPDATE notifications
    SET status = 'sent', sent_at = now()
    WHERE id IN (
      SELECT id FROM notifications
      WHERE status = 'pending' AND channel = 'email'
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 50
    )
    RETURNING id, channel, recipient, subject, body;
  `;
  let sent = 0;
  let failed = 0;
  for (const notification of pending) {
    try {
      await sendEmail(notification.recipient, notification.subject || 'Golden Express notification', notification.body);
      sent += 1;
    } catch (error) {
      failed += 1;
      await sql`UPDATE notifications SET status = 'failed' WHERE id = ${notification.id};`;
    }
  }
  return { claimed: pending.length, sent, failed };
}
