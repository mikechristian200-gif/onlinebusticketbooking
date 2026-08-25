import Link from 'next/link';
import { requireCustomerAuth } from '@/app/lib/auth';
import { getCustomerBookings } from '@/app/lib/booking-data';
import { formatFare } from '@/app/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CustomerBookingsPage() {
  const customer = await requireCustomerAuth();
  const bookings = await getCustomerBookings(customer.id);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Customer account</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">My bookings</h1><p className="mt-2 text-sm text-slate-600">Welcome, {customer.name}. View your tickets and booking status here.</p></div>
          <div className="flex gap-2"><Link href="/booking" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Book a trip</Link><Link href="/customer/logout" className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Log out</Link></div>
        </div>
        {bookings.length === 0 ? <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">You have no bookings yet.</div> : <div className="space-y-4">{bookings.map((booking) => <Link key={booking.reference} href={`/booking/confirmation/${booking.reference}`} className="block rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-blue-300"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono font-semibold text-blue-700">{booking.reference}</p><h2 className="mt-1 text-lg font-semibold text-slate-900">{booking.route.origin} → {booking.route.destination}</h2><p className="text-sm text-slate-500">{booking.route.date} · {booking.route.departure} · Seats: {booking.seats.map((seat) => seat.label).join(', ') || '—'}</p></div><div className="sm:text-right"><p className="font-semibold text-slate-900">{formatFare(booking.totalAmount)}</p><span className="text-sm capitalize text-slate-500">{booking.status}</span></div></div></Link>)}</div>}
      </div>
    </main>
  );
}
