'use client';

import { useState } from 'react';
import { AdminRoute, RouteStatus } from '@/app/lib/definitions';

export type RouteFormInput = {
  id?: string;
  origin: string;
  destination: string;
  date: string;
  departure: string;
  arrival: string;
  duration: string;
  busId: string;
  price: number;
  amenities: string[];
  status: RouteStatus;
  driverId: string;
  delayMinutes: number;
  departureCount: number;
};

type Driver = { id: string; name: string; email: string };

export default function RouteForm({
  route,
  buses,
  drivers,
  onSubmit,
  isLoading = false,
}: {
  route?: AdminRoute;
  buses: { id: string; name: string; capacity: number }[];
  drivers: Driver[];
  onSubmit: (input: RouteFormInput) => Promise<void>;
  isLoading?: boolean;
}) {
  const [form, setForm] = useState<RouteFormInput>({
    id: route?.id,
    origin: route?.origin ?? '',
    destination: route?.destination ?? '',
    date: route?.date ?? new Date().toISOString().slice(0, 10),
    departure: route?.departure ?? '',
    arrival: route?.arrival ?? '',
    duration: route?.duration ?? '',
    busId: route?.busId ?? '',
    price: route?.price ?? 0,
    amenities: route?.amenities ?? [],
    status: route?.status ?? 'scheduled',
    driverId: route?.driverId ?? '',
    delayMinutes: route?.delayMinutes ?? 0,
    departureCount: 1,
  });
  const [amenityText, setAmenityText] = useState(form.amenities.join(', '));
  const [error, setError] = useState('');

  const update = (key: keyof RouteFormInput, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value } as RouteFormInput));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.busId || form.price <= 0) {
      setError('Select a bus and enter a positive ticket price.');
      return;
    }
    try {
      await onSubmit({
        ...form,
        amenities: amenityText.split(',').map((item) => item.trim()).filter(Boolean),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save route.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ['origin', 'Origin', 'e.g. Limbe'],
          ['destination', 'Destination', 'e.g. Buea'],
          ['departure', 'Departure', 'e.g. 08:30 AM'],
          ['arrival', 'Arrival', 'e.g. 10:45 AM'],
          ['duration', 'Duration', 'e.g. 2h 15m'],
        ] as const).map(([key, label, placeholder]) => (
          <label key={key} className="space-y-1 text-sm text-slate-700">
            <span>{label}</span>
            <input required value={form[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="block w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
        ))}
        <label className="space-y-1 text-sm text-slate-700">
          <span>Travel date</span>
          <input required type="date" value={form.date} onChange={(event) => update('date', event.target.value)} className="block w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Bus</span>
          <select required value={form.busId} onChange={(event) => update('busId', event.target.value)} className="block w-full rounded-lg border border-slate-200 px-3 py-2">
            <option value="">Select a bus</option>
            {buses.map((bus) => <option key={bus.id} value={bus.id}>{bus.name} - {form.origin || 'departure'} to {form.destination || 'arrival'} ({bus.capacity} seats)</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Ticket price (FCFA)</span>
          <input required min="1" type="number" value={form.price} onChange={(event) => update('price', Number(event.target.value))} className="block w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Status</span>
          <select value={form.status} onChange={(event) => update('status', event.target.value)} className="block w-full rounded-lg border border-slate-200 px-3 py-2">
            <option value="scheduled">Scheduled</option>
            <option value="boarding">Boarding</option>
            <option value="departed">Departed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Driver</span>
          <select value={form.driverId} onChange={(event) => update('driverId', event.target.value)} className="block w-full rounded-lg border border-slate-200 px-3 py-2">
            <option value="">Unassigned</option>
            {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} - {form.origin || 'departure'} to {form.destination || 'arrival'}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Departures every 90 minutes</span>
          <input required min="1" type="number" value={form.departureCount} onChange={(event) => update('departureCount', Number(event.target.value))} className="block w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Delay (minutes)</span>
          <input min="0" type="number" value={form.delayMinutes} onChange={(event) => update('delayMinutes', Number(event.target.value))} className="block w-full rounded-lg border border-slate-200 px-3 py-2" />
        </label>
      </div>
      <label className="block space-y-1 text-sm text-slate-700">
        <span>Amenities (comma separated)</span>
        <input value={amenityText} onChange={(event) => setAmenityText(event.target.value)} placeholder="Wi-Fi, Air conditioning, Charging" className="block w-full rounded-lg border border-slate-200 px-3 py-2" />
      </label>
      <button disabled={isLoading} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
        {isLoading ? 'Saving...' : route ? 'Update route' : 'Create route'}
      </button>
    </form>
  );
}
