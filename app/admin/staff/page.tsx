'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppUser } from '@/app/lib/auth';

type StaffForm = {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: AppUser['role'];
};

const emptyForm: StaffForm = { name: '', email: '', password: '', role: 'manager' };

export default function AdminStaffPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const response = await fetch('/api/staff');
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(result.error || 'Could not load staff accounts.');
      return;
    }
    setUsers(result);
  };

  useEffect(() => { loadUsers(); }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const response = await fetch('/api/staff', {
      method: form.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(result.error || 'Could not save staff account.');
      return;
    }
    setForm(emptyForm);
    await loadUsers();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this staff account?')) return;
    const response = await fetch(`/api/staff?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || 'Could not delete staff account.');
      return;
    }
    await loadUsers();
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Manage staff</h1>
            <p className="mt-2 text-sm text-slate-600">Update login details and manage staff access.</p>
          </div>
          <Link href="/admin" className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-300">Back to dashboard</Link>
        </div>

        {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{form.id ? 'Edit staff account' : 'Create staff account'}</h2>
          <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" required className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email address" required className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={form.id ? 'New password (optional)' : 'Password'} minLength={form.id ? undefined : 6} required={!form.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AppUser['role'] })} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="driver">Driver</option>
            </select>
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : form.id ? 'Save changes' : 'Create account'}</button>
              {form.id ? <button type="button" onClick={() => setForm(emptyForm)} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button> : null}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading staff...</div> : users.map((user) => (
            <div key={user.id} className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-slate-900">{user.name}</p><p className="text-sm text-slate-500">{user.email} · <span className="capitalize">{user.role}</span></p></div>
              <div className="flex gap-2"><button onClick={() => setForm({ id: user.id, name: user.name, email: user.email, password: '', role: user.role })} className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700">Edit</button><button onClick={() => remove(user.id)} className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">Delete</button></div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
