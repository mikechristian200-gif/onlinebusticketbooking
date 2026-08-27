import { sql } from '@/app/lib/db';

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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Email provider is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

async function sendSms(to: string, text: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) throw new Error('SMS provider is not configured.');
  const body = new URLSearchParams({ To: to, From: from, Body: text });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`SMS provider returned ${response.status}.`);
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
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL) {
      const result = await sql`
        INSERT INTO notifications (customer_id, booking_id, channel, notification_type, recipient, subject, body)
        VALUES (${reminder.customerId}, ${reminder.bookingId}, 'email', ${`departure_${reminder.reminderType}`}, ${reminder.email}, ${subject}, ${text})
        ON CONFLICT (booking_id, channel, notification_type) DO NOTHING
        RETURNING id;
      `;
      queued += result.length;
    }
    if (reminder.phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      const result = await sql`
        INSERT INTO notifications (customer_id, booking_id, channel, notification_type, recipient, subject, body)
        VALUES (${reminder.customerId}, ${reminder.bookingId}, 'sms', ${`departure_${reminder.reminderType}`}, ${reminder.phone}, NULL, ${text})
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
      WHERE status = 'pending' AND notification_type IN ('departure_24h', 'departure_1h')
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
      if (notification.channel === 'email') await sendEmail(notification.recipient, notification.subject, notification.body);
      if (notification.channel === 'sms') await sendSms(notification.recipient, notification.body);
      sent += 1;
    } catch (error) {
      failed += 1;
      await sql`UPDATE notifications SET status = 'failed' WHERE id = ${notification.id};`;
    }
  }
  return { claimed: pending.length, sent, failed };
}
