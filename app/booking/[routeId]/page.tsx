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
    <main className="min-h-screen bg-[#eef3f1] px-4 py-4 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl sm:p-10">
          <div className="absolute inset-0 bg-[url('/hero-mobile.png')] bg-cover bg-center opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/75 to-transparent" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.24em] text-orange-300">{route.busName}</p>
              <h1 className="mt-2 text-3xl font-black text-white">
                {route.origin} to {route.destination}
              </h1>
              <p className="mt-2 text-sm text-slate-200">
                {route.date} - {route.departure} departure - {route.duration}
              </p>
            </div>
            <div className="relative rounded-3xl border border-white/20 bg-white/10 px-6 py-4 text-center backdrop-blur-sm">
              <p className="text-sm text-slate-300">Starting fare</p>
              <p className="mt-2 text-2xl font-black text-white">
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
