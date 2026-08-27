CREATE UNIQUE INDEX IF NOT EXISTS notifications_reminder_idempotency_idx
  ON notifications (booking_id, channel, notification_type)
  WHERE booking_id IS NOT NULL
    AND notification_type IN ('departure_24h', 'departure_1h');
