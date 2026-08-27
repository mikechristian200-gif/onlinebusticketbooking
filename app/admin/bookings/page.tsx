import Link from 'next/link';
import { getBookings } from '@/app/lib/booking-data';
import { formatFare } from '@/app/lib/utils';
import BookingActions from '@/app/ui/admin/booking-actions';
import { requireRole } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  await requireRole(['admin', 'manager']);
  const bookings = await getBookings();

  return (
    <main className="operations-page min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Bookings</h1>
          </div>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            New booking
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
          <div className="hidden grid-cols-[1.1fr_1.4fr_1fr_1fr_0.8fr_1.2fr] gap-4 border-b border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 md:grid">
            <span>Reference</span>
            <span>Passenger</span>
            <span>Route</span>
            <span>Seats</span>
            <span className="text-right">Total</span>
            <span className="text-right">Actions</span>
          </div>

          {bookings.map((booking) => (
            <div
              key={booking.reference}
              className="grid gap-3 border-b border-slate-100 px-5 py-4 text-sm transition last:border-b-0 hover:bg-slate-50 md:grid-cols-[1.1fr_1.4fr_1fr_1fr_0.8fr_1.2fr] md:items-center"
            >
              <Link href={`/booking/confirmation/${booking.reference}`} className="font-mono font-semibold text-blue-700">{booking.reference}</Link>
              <span>
                <span className="block font-medium text-slate-900">{booking.passengerName}</span>
                <span className="block text-slate-500">{booking.passengerEmail}</span>
              </span>
              <span className="text-slate-700">
                {booking.route.origin} to {booking.route.destination}
              </span>
              <span className="text-slate-700">
                {booking.seats.map((seat) => seat.label).join(', ') || 'None'}
              </span>
              <span className="font-semibold text-slate-900 md:text-right">{formatFare(booking.totalAmount)}</span>
              <BookingActions booking={booking} />
            </div>
          ))}

          {bookings.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No bookings yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
