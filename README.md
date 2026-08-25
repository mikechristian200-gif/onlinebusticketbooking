# Golden Express bus ticket booking

Next.js bus ticket booking application backed by PostgreSQL.

## Database setup

1. Create a PostgreSQL database and copy `.env.example` to `.env.local`.
2. Set `POSTGRES_URL` and a strong `AUTH_SECRET`.
3. Apply migrations before starting the app:

   ```bash
   pnpm db:migrate
   pnpm db:check
   ```

4. Create the initial staff accounts:

   ```bash
   pnpm db:seed:staff
   ```

   In production, set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and optionally `INITIAL_ADMIN_NAME` first. Development defaults are available only when `NODE_ENV` is not `production`.

5. Start the app with `pnpm dev`, then use `/seed` once to load sample buses and schedules if needed.

The application never creates or alters tables during normal page requests. Deployments should run `pnpm db:migrate` as a release step and fail if migrations cannot be applied.

## Schema

The migrations create relational tables for customers, staff roles and permissions, buses, route definitions, schedules, seats, bookings, booking-seat reservations, payments, cancellations, refunds, notifications, and audit logs. Foreign keys use restrictive deletes for financial and booking history, cascading deletes only for dependent seat/notification records, and indexes cover route search, schedule availability, bookings, payments, and audit history.

## Backups

Create a PostgreSQL custom-format backup with:

```bash
pnpm db:backup
```

Backups are written to the local `backups/` directory, which is ignored by Git. The command requires the PostgreSQL client tools (`pg_dump`) on `PATH`. Store backups outside the application host as well and test restores regularly. A restore can be performed with PostgreSQL’s `pg_restore`, for example:

```bash
pg_restore --dbname="$POSTGRES_URL" --clean --if-exists backups/golden-express-YYYY-MM-DDTHH-MM-SS-sssZ.dump
```

Never commit `.env`, `.env.local`, passwords, or backup files.
