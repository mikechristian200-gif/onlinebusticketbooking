DO $$
BEGIN
  IF to_regclass('public.legacy_routes') IS NOT NULL THEN
    EXECUTE $migration$
      INSERT INTO routes (id, origin, destination, created_at, updated_at)
      SELECT id, origin, destination, COALESCE(created_at, now()), COALESCE(updated_at, now())
      FROM legacy_routes ON CONFLICT (id) DO NOTHING
    $migration$;
    EXECUTE $migration$
      INSERT INTO schedules (id, route_id, bus_id, driver_id, travel_date, departure, arrival, duration, price, amenities, status, delay_minutes, created_at, updated_at)
      SELECT id, id, bus_id, driver_id, date, departure, arrival, duration, price,
             COALESCE(amenities, '[]'::jsonb), COALESCE(status, 'scheduled'), COALESCE(delay_minutes, 0),
             COALESCE(created_at, now()), COALESCE(updated_at, now())
      FROM legacy_routes ON CONFLICT (id) DO NOTHING
    $migration$;
  END IF;

  IF to_regclass('public.legacy_seats') IS NOT NULL THEN
    EXECUTE $migration$
      INSERT INTO seats (id, schedule_id, label, type, available, price)
      SELECT id, route_id, label, type, available, price
      FROM legacy_seats ON CONFLICT (schedule_id, id) DO NOTHING
    $migration$;
  END IF;

  IF to_regclass('public.legacy_bookings') IS NOT NULL THEN
    EXECUTE $migration$
      INSERT INTO bookings (id, reference, schedule_id, customer_id, passenger_name, passenger_email, passenger_phone, total_amount, payment_method, status, created_at, updated_at)
      SELECT b.id, b.reference, b.route_id,
             CASE WHEN b.customer_id IS NOT NULL AND EXISTS (SELECT 1 FROM customers c WHERE c.id = b.customer_id) THEN b.customer_id ELSE NULL END,
             b.passenger_name, b.passenger_email, b.passenger_phone, COALESCE(b.total_amount, 0), COALESCE(b.payment_method, 'cash'),
             CASE WHEN b.status IN ('pending', 'confirmed', 'cancelled', 'completed') THEN b.status ELSE 'confirmed' END,
             COALESCE(b.created_at, now()), COALESCE(b.created_at, now())
      FROM legacy_bookings b ON CONFLICT (id) DO NOTHING
    $migration$;
    EXECUTE $migration$
      INSERT INTO booking_seats (booking_id, schedule_id, seat_id, fare_amount, released_at)
      SELECT b.id, b.route_id, seat.value, COALESCE(s.price, 0),
             CASE WHEN b.status = 'cancelled' THEN COALESCE(b.created_at, now()) ELSE NULL END
      FROM legacy_bookings b
      CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(b.seats, '[]'::jsonb)) seat(value)
      JOIN seats s ON s.schedule_id = b.route_id AND s.id = seat.value
      ON CONFLICT (booking_id, seat_id) DO NOTHING
    $migration$;
    PERFORM setval(pg_get_serial_sequence('bookings', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM bookings), 1), 1), true);
  END IF;
END $$;

UPDATE seats s
SET available = false
WHERE EXISTS (
  SELECT 1 FROM booking_seats bs
  JOIN bookings b ON b.id = bs.booking_id
  WHERE bs.schedule_id = s.schedule_id AND bs.seat_id = s.id
    AND bs.released_at IS NULL AND b.status IN ('pending', 'confirmed', 'completed')
);
