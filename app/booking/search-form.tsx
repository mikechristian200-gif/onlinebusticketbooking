'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';

export default function SearchForm() {
  const [origin, setOrigin] = useState('Limbe');
  const [destination, setDestination] = useState('Buea');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams({
      from: origin,
      to: destination,
      date,
    }).toString();

    router.push(`/booking?${query}`);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-700">
          <span>Origin</span>
          <input
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Destination</span>
          <input
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Travel date</span>
          <input
            type="date"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 text-right">
        <Button type="submit" className="w-full md:w-auto">
          Find buses
        </Button>
      </div>
    </form>
  );
}
