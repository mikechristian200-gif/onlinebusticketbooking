'use client';

import { useState } from 'react';
import { Booking } from '@/app/lib/definitions';

export default function BookingActions({ booking }: { booking: Booking }) {
  const [status, setStatus] = useState(booking.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateStatus = async (nextStatus: 'confirmed' | 'cancelled' | 'completed') => {
    setLoading(true);
    setError('');
    const response = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: booking.reference, status: nextStatus }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error || 'Could not update booking.');
      return;
    }
    setStatus(result.status);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{status}</span>
      {status !== 'cancelled' ? <button disabled={loading} onClick={() => updateStatus('cancelled')} className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-50">Cancel</button> : null}
      {status === 'confirmed' ? <button disabled={loading} onClick={() => updateStatus('completed')} className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50">Complete</button> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
