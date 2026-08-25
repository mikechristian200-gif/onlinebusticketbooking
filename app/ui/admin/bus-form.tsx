'use client';

import { useState, useEffect } from 'react';
import { Bus } from '@/app/lib/definitions';

interface BusFormProps {
  bus?: Bus;
  onSubmit: (bus: Omit<Bus, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) => Promise<void>;
  isLoading?: boolean;
}

export default function BusForm({ bus, onSubmit, isLoading = false }: BusFormProps) {
  const [formData, setFormData] = useState({
    id: bus?.id || '',
    name: bus?.name || '',
    type: bus?.type || 'standard',
    capacity: bus?.capacity || 40,
    amenities: bus?.amenities || [],
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value,
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== amenity),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim() || !formData.type.trim() || formData.capacity <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        id: bus?.id || undefined,
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        amenities: formData.amenities,
      };
      await onSubmit(submitData);
      setSuccess(bus ? 'Bus updated successfully!' : 'Bus added successfully!');
      if (!bus) {
        setFormData({
          id: '',
          name: '',
          type: 'standard',
          capacity: 40,
          amenities: [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bus');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 ring-1 ring-green-200">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Bus Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Golden Express 01"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700">
            Bus Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="luxury">Luxury</option>
            <option value="vip">VIP</option>
            <option value="sleeper">Sleeper</option>
          </select>
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-slate-700">
            Capacity (seats) *
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={handleChange}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Amenities</label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAmenity();
              }
            }}
            placeholder="e.g., WiFi, AC, Charging"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddAmenity}
            className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Add
          </button>
        </div>

        {formData.amenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(amenity)}
                  className="text-blue-500 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : bus ? 'Update Bus' : 'Add Bus'}
      </button>
    </form>
  );
}
