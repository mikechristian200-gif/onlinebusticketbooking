'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminRoute, Bus } from '@/app/lib/definitions';
import RouteForm, { RouteFormInput } from '@/app/ui/admin/route-form';

type Driver = { id: string; name: string; email: string };

export default function AdminRoutesPage() {
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editing, setEditing] = useState<AdminRoute | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [routeResponse, busResponse, driverResponse] = await Promise.all([
        fetch('/api/routes'),
        fetch('/api/buses'),
        fetch('/api/staff/drivers'),
      ]);
      if (!routeResponse.ok || !busResponse.ok || !driverResponse.ok) throw new Error('Could not load route data.');
      setRoutes(await routeResponse.json());
      setBuses(await busResponse.json());
      setDrivers(await driverResponse.json());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load route data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (input: RouteFormInput) => {
    setSaving(true);
    const response = await fetch('/api/routes', {
      method: input.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) throw new Error(result.error || 'Could not save route.');
    setShowForm(false);
    setEditing(undefined);
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this route? Routes with bookings must be cancelled instead.')) return;
    const response = await fetch(`/api/routes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Could not delete route.');
      return;
    }
    await load();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Admin</p><h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage routes</h1><p className="mt-2 text-sm text-slate-600">Create real scheduled trips, assign buses and drivers, and control availability.</p></div>
          <Link href="/admin" className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-300">Back to dashboard</Link>
        </div>
        {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        {!showForm && !editing ? <button onClick={() => setShowForm(true)} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">+ Create scheduled trip</button> : null}
        {showForm || editing ? <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{editing ? 'Edit scheduled trip' : 'Create scheduled trip'}</h2><button onClick={() => { setShowForm(false); setEditing(undefined); }} className="text-sm text-slate-500">Close</button></div><RouteForm route={editing} buses={buses} drivers={drivers} onSubmit={save} isLoading={saving} /></section> : null}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading routes...</div> : routes.length === 0 ? <div className="p-10 text-center text-sm text-slate-500">No routes yet. Create the first real scheduled trip.</div> : <div className="divide-y divide-slate-100">
            {routes.map((route) => <div key={route.id} className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
              <div><p className="font-semibold text-slate-900">{route.origin} → {route.destination}</p><p className="text-sm text-slate-500">{route.date} · {route.departure} · {route.busName}</p><p className="mt-1 text-xs text-slate-500">Driver: {route.driverName || 'Unassigned'}</p></div>
              <div><p className="text-sm font-medium text-slate-900">{route.price.toLocaleString()} FCFA</p><p className="text-xs text-slate-500">{route.availableSeats}/{route.totalSeats ?? route.seatCount} seats available</p></div>
              <div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{route.status}</span><p className="mt-2 text-xs text-slate-500">{route.seatCount} seats generated</p></div>
              <div className="flex gap-2 md:justify-end"><button onClick={() => { setEditing(route); setShowForm(false); }} className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">Edit</button><button onClick={() => remove(route.id)} className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></div>
            </div>)}
          </div>}
        </section>
      </div>
    </main>
  );
}
