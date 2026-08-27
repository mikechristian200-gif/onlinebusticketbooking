'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { BusRoute } from '@/app/lib/definitions';
import { formatFare } from '@/app/lib/utils';
import ThreeDSeatMap from './three-d-seat-map';

export default function RouteBookingForm({ busRoute }: { busRoute: BusRoute }) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const totalPrice = useMemo(() => {
    return busRoute.price * selectedSeats.length;
  }, [busRoute.seats, selectedSeats]);

  const handleSeatToggle = (seatId: string, available: boolean) => {
    if (!available) {
      return;
    }

    setSelectedSeats((current) =>
      current.includes(seatId)
        ? current.filter((item) => item !== seatId)
        : [...current, seatId],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!selectedSeats.length || !passengerName.trim() || !passengerEmail.trim()) {
      setErrorMessage('Please select seats and enter passenger details.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeId: busRoute.id,
          seatIds: selectedSeats,
          passengerName,
          passengerEmail,
          passengerPhone,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      router.push(`/booking/confirmation/${data.reference}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Choose seats</h2>
          <p className="mt-2 text-sm text-slate-500">Pick one or more available seats for this trip.</p>

          <div className="mt-5">
            <ThreeDSeatMap
              seats={busRoute.seats}
              selectedSeatIds={selectedSeats}
              onToggleSeat={handleSeatToggle}
            />
          </div>

        </div>

        <div className="rounded-3xl bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Booking summary</h3>
          <dl className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <dt>Trip</dt>
              <dd>{busRoute.origin} to {busRoute.destination}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <dt>Date</dt>
              <dd>{busRoute.date}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <dt>Seats</dt>
              <dd>{selectedSeats.length || 0}</dd>
            </div>
            <div className="flex justify-between pt-3 text-base font-semibold text-slate-900">
              <dt>Total price</dt>
              <dd>{formatFare(totalPrice)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span>Passenger name</span>
            <input
              value={passengerName}
              onChange={(event) => setPassengerName(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="Full name"
              required
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Email address</span>
            <input
              type="email"
              value={passengerEmail}
              onChange={(event) => setPassengerEmail(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Phone number</span>
            <input
              value={passengerPhone}
              onChange={(event) => setPassengerPhone(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="+237 6XX XXX XXX"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-700">
            <span>Payment method</span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            >
              <option value="cash">Pay at agency</option>
              <option value="mobile-money">Mobile money</option>
              <option value="card">Card</option>
            </select>
          </label>
        </div>

        {paymentMethod === 'mobile-money' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Send the exact total to {process.env.NEXT_PUBLIC_MOMO_NUMBER || 'the company Mobile Money number'} and keep the transaction reference. Your booking will be confirmed after payment verification.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {selectedSeats.length > 0
              ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} selected`
              : 'Select seats to continue.'}
          </p>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? 'Confirming...' : 'Confirm booking'} <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>

      {errorMessage ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
