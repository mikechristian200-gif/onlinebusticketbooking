import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardRoute } from '@/app/lib/auth';
import LoginForm from '@/app/ui/login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect(getDashboardRoute(user.role));
  }

  const selectedRole = (resolvedSearchParams.role === 'manager' || resolvedSearchParams.role === 'driver' ? resolvedSearchParams.role : 'admin') as 'admin' | 'manager' | 'driver';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Golden Express</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Company login</h1>
          <p className="mt-2 text-sm text-slate-600">Access the admin, manager, or driver dashboard.</p>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {(['admin', 'manager', 'driver'] as const).map((role) => (
            <a
              key={role}
              href={`/login?role=${role}`}
              className={`rounded-xl px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide transition ${selectedRole === role ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {role}
            </a>
          ))}
        </div>

        {resolvedSearchParams.error === 'invalid' ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid email or password.
          </div>
        ) : null}

        <LoginForm preselectedRole={selectedRole} />

        <div className="mt-6 text-center text-sm text-slate-600">
          Staff accounts are created by an administrator.
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Staff access</p>
          <p className="mt-2">Use the company credentials provided by your administrator.</p>
        </div>

        <div className="mt-6 text-center">
          <a href="/booking" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to booking page
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
