import Link from 'next/link';
import { getBusRoutes } from '@/app/lib/booking-data';
import { formatFare } from '@/app/lib/utils';
import SearchForm from './search-form';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[]; date?: string | string[]; time?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const routes = await getBusRoutes(resolvedSearchParams);
  const availableRoutes = await getBusRoutes({ ...resolvedSearchParams, time: undefined });
  const routeOptions = Array.from(
    new Map(availableRoutes.map((route) => [`${route.origin}|${route.destination}`, { origin: route.origin, destination: route.destination }])).values(),
  );
  const departureOptions = Array.from(new Set(availableRoutes.map((route) => route.departure))).sort();

  return (
    <main className="min-h-screen bg-[#eef3f1] px-4 py-4 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-7 py-12 text-white shadow-2xl sm:px-10 sm:py-16">
          <div className="absolute inset-0 bg-[url('/hero-desktop.png')] bg-cover bg-center opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/65 to-transparent" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">Travel further, simply</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Your next road story starts here.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
            Find and book bus routes across Cameroon, especially in the Southwest region.
            </p>
          </div>
        </div>

        <SearchForm routeOptions={routeOptions} departureOptions={departureOptions} />

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
              <div key={route.id} className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{route.busName}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      {route.origin} to {route.destination}
                    </h3>
                  </div>
                  <p className="text-lg font-black text-[#e85d3f]">{formatFare(route.price)}</p>
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
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition group-hover:bg-[#e85d3f]"
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
