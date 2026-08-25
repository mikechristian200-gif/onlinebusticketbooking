import Link from 'next/link';
import { getBusRoutes } from '@/app/lib/booking-data';
import { formatFare } from '@/app/lib/utils';
import SearchForm from './search-form';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[]; date?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const routes = await getBusRoutes(resolvedSearchParams);
  const routeOptions = Array.from(
    new Map(routes.map((route) => [`${route.origin}|${route.destination}`, { origin: route.origin, destination: route.destination }])).values(),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-slate-900 px-8 py-10 text-white shadow-xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">Golden Express Bus Booking</h1>
          <p className="mt-4 max-w-2xl text-slate-200">
            Find and book bus routes across Cameroon, especially in the Southwest region.
          </p>
        </div>

        <SearchForm routeOptions={routeOptions} />

        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Available routes</p>
              <h2 className="text-2xl font-semibold text-slate-900">Select a bus</h2>
            </div>
            <p className="text-sm text-slate-600">
              {routes.length}
              {routes.length === 1 ? ' result' : ' results'} found.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {routes.map((route) => (
              <div key={route.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{route.busName}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      {route.origin} to {route.destination}
                    </h3>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{formatFare(route.price)}</p>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span>Departure</span>
                    <span>{route.departure}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span>Arrival</span>
                    <span>{route.arrival}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span>Duration</span>
                    <span>{route.duration}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {route.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/booking/${route.id}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Book seats
                </Link>
              </div>
            ))}

            {routes.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-slate-700 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-semibold">No matching routes found</h3>
                <p className="mt-3 text-sm text-slate-500">
                  Try a different origin, destination, or travel date.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
