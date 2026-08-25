'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { BusRoute } from '@/app/lib/definitions';
import { formatFare } from '@/app/lib/utils';

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
    return selectedSeats.reduce((total, seatId) => {
      const seat = busRoute.seats.find((item) => item.id === seatId);
      return total + (seat?.price ?? 0);
    }, 0);
  }, [busRoute.seats, selectedSeats]);

  const frontSeats = busRoute.seats.slice(0, 2);
  const rearSeats = busRoute.seats.slice(2);

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

          <div className="mt-5 rounded-[2rem] border-4 border-slate-300 bg-slate-100 p-4 shadow-inner sm:p-6">
            <div className="mb-5 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white">
              <div className="flex items-center justify-between">
                <span>Front of bus</span>
                <span className="rounded-lg bg-slate-700 px-3 py-1 text-xs uppercase tracking-[0.15em]">Driver</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-600 pt-4 sm:gap-3">
                <span className="flex min-h-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 text-center text-xs text-slate-400">Driver</span>
                {frontSeats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.id);
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => handleSeatToggle(seat.id, seat.available)}
                      aria-label={`${seat.label}, ${seat.available ? 'available' : 'sold out'}`}
                      className={`min-h-20 rounded-2xl border-2 px-2 py-3 text-left text-sm transition sm:px-4 ${seat.available ? isSelected ? 'border-blue-300 bg-blue-600 text-white' : 'border-emerald-300 bg-white text-slate-700 hover:bg-blue-50' : 'cursor-not-allowed border-slate-500 bg-slate-700 text-slate-400'}`}
                    >
                      <span className="font-semibold">{seat.label}</span>
                      <p className={`mt-2 text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{seat.available ? (isSelected ? 'Selected' : 'Available') : 'Sold out'}</p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs font-normal text-slate-300">Two passenger seats beside the driver</p>
            </div>
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Rear passenger rows - four seats across</p>
            <div className="space-y-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-200/70 p-3 sm:p-4">
              {Array.from({ length: Math.ceil(rearSeats.length / 4) }, (_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-[1.25rem_repeat(4,minmax(0,1fr))] items-stretch gap-2 sm:gap-3">
                  <span className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">{rowIndex + 1}</span>
                  {rearSeats.slice(rowIndex * 4, rowIndex * 4 + 4).map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => handleSeatToggle(seat.id, seat.available)}
                        aria-label={`${seat.label}, ${seat.available ? 'available' : 'sold out'}`}
                        className={`min-h-24 rounded-2xl border-2 px-2 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 sm:px-4 ${seat.available ? isSelected ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200' : 'border-emerald-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50' : 'cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{seat.label}</span>
                          <span className={`hidden rounded-full px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] sm:inline ${isSelected ? 'bg-blue-500 text-blue-50' : 'bg-slate-100 text-slate-600'}`}>{seat.type}</span>
                        </div>
                        <p className={`mt-3 text-xs ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{seat.available ? (isSelected ? 'Selected' : 'Available') : 'Sold out'}</p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-emerald-300 bg-white" /> Available</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-blue-600" /> Selected</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded border-2 border-slate-300 bg-slate-200" /> Sold out</span>
              <span className="ml-auto text-slate-400">Aisle</span>
            </div>
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
