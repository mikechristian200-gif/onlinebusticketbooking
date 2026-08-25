import { logoutAction } from '@/app/login/actions';
import { requireRole } from '@/app/lib/auth';
import { getAdminMetrics } from '@/app/lib/booking-data';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireRole('admin');
  const metrics = await getAdminMetrics();

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-blue-300">Admin dashboard</p>
              <h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1>
            </div>

            <form action={logoutAction}>
              <button className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Ticket sales</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{Number(metrics.sales).toLocaleString()} FCFA</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active routes</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{Number(metrics.active_routes).toLocaleString()}</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Confirmed bookings</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{Number(metrics.bookings).toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <a href="/admin/bookings" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              View bookings
            </a>
            <a href="/admin/buses" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              Manage buses
            </a>
            <a href="/admin/routes" className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
              Manage routes
            </a>
            <a href="/booking" className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              New booking
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
