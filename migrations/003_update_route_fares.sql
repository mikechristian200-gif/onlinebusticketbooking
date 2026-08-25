-- Update published fares without changing historical booking/payment amounts.
-- Reverse routes are represented as separate route records.
UPDATE schedules AS s
SET price = CASE
  WHEN lower(r.origin) = 'kumba' AND lower(r.destination) = 'douala' THEN 4000
  WHEN lower(r.origin) = 'douala' AND lower(r.destination) = 'kumba' THEN 4000
  WHEN lower(r.origin) = 'limbe' AND lower(r.destination) = 'buea' THEN 1000
  WHEN lower(r.origin) = 'buea' AND lower(r.destination) = 'limbe' THEN 1000
  WHEN lower(r.origin) = 'kumba' AND lower(r.destination) = 'limbe' THEN 3000
  WHEN lower(r.origin) = 'buea' AND lower(r.destination) = 'douala' THEN 25000
  WHEN lower(r.origin) = 'douala' AND lower(r.destination) = 'buea' THEN 25000
  ELSE s.price
END,
updated_at = now()
FROM routes AS r
WHERE s.route_id = r.id
  AND (
    (lower(r.origin), lower(r.destination)) IN (
      ('kumba', 'douala'), ('douala', 'kumba'),
      ('limbe', 'buea'), ('buea', 'limbe'),
      ('kumba', 'limbe'), ('buea', 'douala'), ('douala', 'buea')
    )
  );

UPDATE seats AS seats
SET price = schedules.price
FROM schedules
JOIN routes ON routes.id = schedules.route_id
WHERE seats.schedule_id = schedules.id
  AND seats.available = true
  AND (lower(routes.origin), lower(routes.destination)) IN (
    ('kumba', 'douala'), ('douala', 'kumba'),
    ('limbe', 'buea'), ('buea', 'limbe'),
    ('kumba', 'limbe'), ('buea', 'douala'), ('douala', 'buea')
  );
