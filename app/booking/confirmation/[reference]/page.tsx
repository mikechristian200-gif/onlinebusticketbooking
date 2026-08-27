import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingByReference } from '@/app/lib/booking-data';
import { getCurrentCustomer, getCurrentUser } from '@/app/lib/auth';
import { formatFare } from '@/app/lib/utils';
import PrintTicketButton from '@/app/ui/print-ticket-button';
import DepartureCountdown from '../../departure-countdown';

export const dynamic = 'force-dynamic';

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = await getBookingByReference(reference);

  if (!booking) {
    notFound();
  }

  const customer = await getCurrentCustomer();
  const staff = await getCurrentUser();
  const isStaff = staff?.role === 'admin' || staff?.role === 'manager';
  if (!isStaff && (!customer || customer.id !== booking.customerId)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl bg-green-50 p-8 ring-1 ring-green-200">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-700">{booking.status === 'pending' ? 'Payment pending' : 'Booking confirmed'}</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Ticket {booking.reference}</h1>
          <p className="mt-3 text-sm text-slate-600">
            Keep this reference for check-in at the Golden Express agency.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Trip</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <dt>Route</dt>
                  <dd className="font-medium text-slate-900">
                    {booking.route.origin} to {booking.route.destination}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Date</dt>
                  <dd>{booking.route.date}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Departure</dt>
                  <dd>{booking.route.departure}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Bus</dt>
                  <dd>{booking.route.busName}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">Passenger</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <dt>Name</dt>
                  <dd className="font-medium text-slate-900">{booking.passengerName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Email</dt>
                  <dd>{booking.passengerEmail}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Phone</dt>
                  <dd>{booking.passengerPhone || 'Not provided'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Status</dt>
                  <dd className="capitalize">{booking.status}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Seats</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {booking.seats.map((seat) => (
                    <span
                      key={seat.id}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                    >
                      {seat.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-slate-500">Total paid or due</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatFare(booking.totalAmount)}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{booking.paymentMethod.replace('-', ' ')}</p>
              </div>
            </div>
          </div>
        </section>

        <DepartureCountdown date={booking.route.date} departure={booking.route.departure} reference={booking.reference} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <PrintTicketButton />
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Book another trip
          </Link>
          <Link
            href={isStaff ? '/admin/bookings' : '/customer/bookings'}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            {isStaff ? 'View bookings' : 'My bookings'}
          </Link>
        </div>
      </div>
    </main>
  );
}
