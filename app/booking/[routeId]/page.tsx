import { notFound } from 'next/navigation';
import { requireCustomerAuth } from '@/app/lib/auth';
import { getBusRouteById } from '@/app/lib/booking-data';
import { formatFare } from '@/app/lib/utils';
import RouteBookingForm from '../route-booking-form';

export const dynamic = 'force-dynamic';

export default async function BookingRoutePage({ params }: { params: Promise<{ routeId: string }> }) {
  // Require customer authentication before allowing booking
  const customer = await requireCustomerAuth();
  
  const resolvedParams = await params;
  const route = await getBusRouteById(resolvedParams.routeId);

  if (!route) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{route.busName}</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                {route.origin} to {route.destination}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {route.date} - {route.departure} departure - {route.duration}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-100 px-6 py-4 text-center">
              <p className="text-sm text-slate-500">Starting fare</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatFare(route.price)}
              </p>
            </div>
          </div>
        </div>

        <RouteBookingForm busRoute={route} />
      </div>
    </main>
  );
}
