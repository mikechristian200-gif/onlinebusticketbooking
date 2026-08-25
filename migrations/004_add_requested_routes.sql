-- Ensure the requested fare routes exist in a fresh or already-migrated database.
INSERT INTO buses (id, name, type, capacity, amenities) VALUES
  ('bus-southwest', 'Golden Express Southwest', 'standard', 6, '["Wi-Fi", "Air conditioning", "Reclining seats"]'::jsonb),
  ('bus-kumba', 'Golden Express Kumba Line', 'standard', 6, '["USB charging", "Snacks", "Reading lights"]'::jsonb),
  ('bus-coastal', 'Golden Express Coastal', 'luxury', 6, '["Restroom", "Large luggage", "Climate control"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO routes (id, origin, destination) VALUES
  ('route-4', 'Buea', 'Limbe'),
  ('route-5', 'Kumba', 'Douala'),
  ('route-6', 'Douala', 'Kumba'),
  ('route-7', 'Kumba', 'Limbe'),
  ('route-8', 'Buea', 'Douala'),
  ('route-9', 'Douala', 'Buea')
ON CONFLICT (id) DO UPDATE SET origin = EXCLUDED.origin, destination = EXCLUDED.destination, updated_at = now();

INSERT INTO schedules (id, route_id, bus_id, travel_date, departure, arrival, duration, price, amenities)
VALUES
  ('route-4', 'route-4', 'bus-southwest', CURRENT_DATE, '11:00 AM', '01:15 PM', '2h 15m', 1000, '["Wi-Fi", "Air conditioning", "Reclining seats"]'::jsonb),
  ('route-5', 'route-5', 'bus-kumba', CURRENT_DATE, '06:30 AM', '09:00 AM', '2h 30m', 4000, '["USB charging", "Snacks", "Reading lights"]'::jsonb),
  ('route-6', 'route-6', 'bus-kumba', CURRENT_DATE, '03:00 PM', '05:30 PM', '2h 30m', 4000, '["USB charging", "Snacks", "Reading lights"]'::jsonb),
  ('route-7', 'route-7', 'bus-coastal', CURRENT_DATE, '07:00 AM', '09:30 AM', '2h 30m', 3000, '["Restroom", "Large luggage", "Climate control"]'::jsonb),
  ('route-8', 'route-8', 'bus-coastal', CURRENT_DATE, '08:00 AM', '01:00 PM', '5h', 25000, '["Restroom", "Large luggage", "Climate control"]'::jsonb),
  ('route-9', 'route-9', 'bus-coastal', CURRENT_DATE, '02:00 PM', '07:00 PM', '5h', 25000, '["Restroom", "Large luggage", "Climate control"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, updated_at = now();

INSERT INTO seats (id, schedule_id, label, type, available, price)
SELECT seat_id, schedule_id, seat_id,
  CASE WHEN right(seat_id, 1) = 'A' THEN 'window' ELSE 'aisle' END,
  true, schedule_price
FROM (VALUES
  ('route-4', 1000), ('route-5', 4000), ('route-6', 4000),
  ('route-7', 3000), ('route-8', 25000), ('route-9', 25000)
) AS requested(schedule_id, schedule_price)
CROSS JOIN (VALUES ('1A'), ('1B'), ('2A'), ('2B'), ('3A'), ('3B')) AS seat(seat_id)
ON CONFLICT (schedule_id, id) DO NOTHING;
