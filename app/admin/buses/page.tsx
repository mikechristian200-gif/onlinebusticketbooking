'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bus } from '@/app/lib/definitions';
import BusForm from '@/app/ui/admin/bus-form';

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | undefined>(undefined);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/buses');
      if (!response.ok) throw new Error('Failed to fetch buses');
      const data = await response.json();
      setBuses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch buses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBus = async (bus: Omit<Bus, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) => {
    setIsFormLoading(true);
    try {
      const response = await fetch('/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bus),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add bus');
      }

      await fetchBuses();
      setShowForm(false);
    } catch (err) {
      throw err;
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleUpdateBus = async (bus: Omit<Bus, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) => {
    setIsFormLoading(true);
    try {
      const response = await fetch('/api/buses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bus),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bus');
      }

      await fetchBuses();
      setEditingBus(undefined);
    } catch (err) {
      throw err;
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;

    try {
      const response = await fetch(`/api/buses?id=${busId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete bus');
      await fetchBuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bus');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage Buses</h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* Form Section */}
        {(showForm || editingBus) && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingBus(undefined);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <BusForm
              bus={editingBus}
              onSubmit={editingBus ? handleUpdateBus : handleAddBus}
              isLoading={isFormLoading}
            />
          </section>
        )}

        {/* Add Bus Button */}
        {!showForm && !editingBus && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            + Add New Bus
          </button>
        )}

        {/* Buses List */}
        <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {isLoading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              Loading buses...
            </div>
          ) : buses.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No buses added yet.
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 md:grid">
                <span>Name</span>
                <span>Type</span>
                <span>Capacity</span>
                <span>Amenities</span>
                <span className="text-right">Actions</span>
              </div>

              {buses.map((bus) => (
                <div
                  key={bus.id}
                  className="grid gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_1fr_1fr_1fr_0.8fr] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{bus.name}</p>
                    <p className="text-xs text-slate-500">{bus.id}</p>
                  </div>
                  <div className="text-slate-700 capitalize">{bus.type}</div>
                  <div className="text-slate-700">{bus.capacity} seats</div>
                  <div className="text-slate-700">
                    {bus.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {bus.amenities.slice(0, 2).map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                          >
                            {amenity}
                          </span>
                        ))}
                        {bus.amenities.length > 2 && (
                          <span className="text-xs text-slate-500">
                            +{bus.amenities.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBus(bus)}
                      className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBus(bus.id)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
