import { logoutAction } from '@/app/login/actions';
import { requireRole } from '@/app/lib/auth';
import { getManagerMetrics } from '@/app/lib/booking-data';

export const dynamic = 'force-dynamic';

export default async function ManagerDashboardPage() {
  const user = await requireRole('manager');
  const metrics = await getManagerMetrics();

  return (
    <main className="operations-page min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="operations-hero rounded-[2rem] p-8 text-white shadow-2xl sm:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-100">Manager dashboard</p>
              <h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1>
            </div>

            <form action={logoutAction}>
              <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50">
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="metric-card rounded-3xl bg-white p-6">
            <p className="text-sm text-slate-500">Fleet on route</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{Number(metrics.fleet_on_route).toLocaleString()}</p>
          </div>
          <div className="metric-card rounded-3xl bg-white p-6">
            <p className="text-sm text-slate-500">Tickets today</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{Number(metrics.tickets_today).toLocaleString()}</p>
          </div>
          <div className="metric-card rounded-3xl bg-white p-6">
            <p className="text-sm text-slate-500">Late departures</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{Number(metrics.late_departures).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
