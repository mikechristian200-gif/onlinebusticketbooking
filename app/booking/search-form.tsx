'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';

export default function SearchForm({ routeOptions, departureOptions }: { routeOptions: { origin: string; destination: string }[]; departureOptions: string[] }) {
  const [origin, setOrigin] = useState(routeOptions[0]?.origin ?? '');
  const [destination, setDestination] = useState(routeOptions[0]?.destination ?? '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams({
      from: origin,
      to: destination,
      date,
      time,
    }).toString();

    router.push(`/booking?${query}`);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-2 text-sm text-slate-700">
          <span>Origin</span>
          <select
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
          >
            <option value="">Any departure location</option>
            {Array.from(new Set(routeOptions.map((route) => route.origin))).map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Destination</span>
          <select
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">Any arrival location</option>
            {Array.from(new Set(routeOptions.map((route) => route.destination))).map((location) => <option key={location} value={location}>{location}</option>)}
          </select>
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
        <label className="space-y-2 text-sm text-slate-700">
          <span>Departure time</span>
          <select
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          >
            <option value="">Any available time</option>
            {departureOptions.map((departure) => <option key={departure} value={departure}>{departure}</option>)}
          </select>
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
