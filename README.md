## Next.js App Router Course - Starter

This is the starter template for the Next.js App Router Course. It contains the starting code for the dashboard application.

For more information, see the [course curriculum](https://nextjs.org/learn) on the Next.js Website.

## Local database setup

To run the Golden Express booking app with PostgreSQL:

1. Create a local database and user.
2. Copy `.env.example` to `.env.local`.
3. Set `POSTGRES_URL` to your database connection string, for example:
   `postgres://username:password@localhost:5432/your_database`
4. Start the app with `pnpm dev`.
5. Seed the route data by visiting `http://localhost:3000/seed` in your browser.
6. Open `http://localhost:3000/booking` to test the booking flow.

If the app reports `password authentication failed`, update `POSTGRES_URL` with the correct database user and password.

Run `pnpm db:check` to create any missing booking tables or columns, then verify the configured database connection, schema, and current row counts.
