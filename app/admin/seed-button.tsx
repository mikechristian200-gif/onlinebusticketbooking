'use client';

import { useState } from 'react';

export default function SeedButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setStatus('loading');
    setMessage('Seeding database...');

    try {
      const response = await fetch('/seed');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Seeding failed');
      }

      setStatus('done');
      setMessage('Database seeded successfully.');
      window.location.href = '/booking';
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Seeding failed');
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      <button
        type="button"
        onClick={handleSeed}
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Seeding...' : 'Seed database'}
      </button>

      {message ? (
        <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
