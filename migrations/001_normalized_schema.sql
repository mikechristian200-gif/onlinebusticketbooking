CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Preserve the original tables so migration 002 can copy their data safely.
DO $$
BEGIN
  IF to_regclass('public.routes') IS NOT NULL AND to_regclass('public.legacy_routes') IS NULL THEN
    ALTER TABLE public.routes RENAME TO legacy_routes;
  END IF;
  IF to_regclass('public.seats') IS NOT NULL AND to_regclass('public.legacy_seats') IS NULL THEN
    ALTER TABLE public.seats RENAME TO legacy_seats;
  END IF;
  IF to_regclass('public.bookings') IS NOT NULL AND to_regclass('public.legacy_bookings') IS NULL THEN
    ALTER TABLE public.bookings RENAME TO legacy_bookings;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_idx ON customers (lower(email));

CREATE TABLE IF NOT EXISTS staff_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  permission_key TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_role_permissions (
  role_id TEXT NOT NULL REFERENCES staff_roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'driver')),
  role_id TEXT REFERENCES staff_roles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS role_id TEXT;
ALTER TABLE staff_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS staff_users_email_lower_idx ON staff_users (lower(email));
CREATE INDEX IF NOT EXISTS staff_users_role_idx ON staff_users (role_id);

INSERT INTO staff_roles (id, name, description) VALUES
  ('admin', 'Admin', 'Full access to operations and configuration'),
  ('manager', 'Manager', 'Operations and booking management'),
  ('driver', 'Driver', 'Assigned trip and passenger visibility')
ON CONFLICT (id) DO NOTHING;

INSERT INTO permissions (id, permission_key, description) VALUES
  ('manage_staff', 'staff.manage', 'Create and manage staff accounts'),
  ('manage_fleet', 'fleet.manage', 'Create and manage buses'),
  ('manage_schedules', 'schedules.manage', 'Create and manage schedules'),
  ('manage_bookings', 'bookings.manage', 'View and update bookings'),
  ('manage_payments', 'payments.manage', 'View and reconcile payments'),
  ('view_assigned_trips', 'trips.assigned.read', 'View assigned driver trips')
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions ON CONFLICT DO NOTHING;
INSERT INTO staff_role_permissions (role_id, permission_id)
SELECT 'manager', id FROM permissions
WHERE permission_key IN ('manage_fleet', 'manage_schedules', 'manage_bookings', 'manage_payments')
ON CONFLICT DO NOTHING;
INSERT INTO staff_role_permissions (role_id, permission_id)
SELECT 'driver', id FROM permissions WHERE permission_key = 'view_assigned_trips'
ON CONFLICT DO NOTHING;

UPDATE staff_users SET role_id = role WHERE role_id IS NULL;
ALTER TABLE staff_users DROP CONSTRAINT IF EXISTS staff_users_role_id_fkey;
ALTER TABLE staff_users ADD CONSTRAINT staff_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES staff_roles(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(amenities) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (btrim(origin) <> '' AND btrim(destination) <> '' AND lower(origin) <> lower(destination))
);
CREATE INDEX IF NOT EXISTS routes_origin_destination_idx ON routes (lower(origin), lower(destination));

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  bus_id TEXT REFERENCES buses(id) ON DELETE RESTRICT,
  driver_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  travel_date DATE NOT NULL,
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(amenities) = 'array'),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'completed', 'cancelled')),
  delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS schedules_search_idx ON schedules (travel_date, status, route_id);
CREATE INDEX IF NOT EXISTS schedules_bus_idx ON schedules (bus_id, travel_date);
CREATE INDEX IF NOT EXISTS schedules_driver_idx ON schedules (driver_id, travel_date);

CREATE TABLE IF NOT EXISTS seats (
  id TEXT NOT NULL,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('window', 'aisle', 'middle')),
  available BOOLEAN NOT NULL DEFAULT true,
  price INTEGER NOT NULL CHECK (price > 0),
  PRIMARY KEY (schedule_id, id),
  UNIQUE (schedule_id, label)
);
CREATE INDEX IF NOT EXISTS seats_available_idx ON seats (schedule_id, available);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_schedule_idx ON bookings (schedule_id, status);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_created_idx ON bookings (created_at DESC);

CREATE TABLE IF NOT EXISTS booking_seats (
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  fare_amount INTEGER NOT NULL CHECK (fare_amount >= 0),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  PRIMARY KEY (booking_id, seat_id),
  FOREIGN KEY (schedule_id, seat_id) REFERENCES seats(schedule_id, id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS booking_seats_active_idx ON booking_seats (schedule_id, seat_id) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS booking_seats_booking_idx ON booking_seats (booking_id);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'XAF',
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded')),
  provider TEXT,
  provider_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_reference_idx ON payments (provider, provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments (booking_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cancellations (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  cancelled_by_staff_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  cancelled_by_customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS cancellations_booking_idx ON cancellations (booking_id, created_at DESC);

CREATE TABLE IF NOT EXISTS refunds (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  provider_reference TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS refunds_booking_idx ON refunds (booking_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
  notification_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_customer_idx ON notifications (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_delivery_idx ON notifications (status, created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_staff_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  actor_customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_staff_idx ON audit_logs (actor_staff_id, created_at DESC);
