import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { redirect } from 'next/navigation';
import { getCurrentUser, getDashboardRoute } from '@/app/lib/auth';
import { signupAction } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string; created?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const publicSignupAllowed = process.env.ALLOW_PUBLIC_STAFF_SIGNUP === 'true' || process.env.NODE_ENV !== 'production';

  if (user && user.role !== 'admin') {
    redirect(getDashboardRoute(user.role));
  }
  if (!user && !publicSignupAllowed) redirect('/login?error=staff_signup_disabled');

  const selectedRole = (resolvedSearchParams.role === 'manager' || resolvedSearchParams.role === 'driver' ? resolvedSearchParams.role : 'admin') as 'admin' | 'manager' | 'driver';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Golden Express</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Create staff account</h1>
          <p className="mt-2 text-sm text-slate-600">Register a company account for admin, manager, or driver access.</p>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {(['admin', 'manager', 'driver'] as const).map((role) => (
            <a
              key={role}
              href={`/signup?role=${role}`}
              className={`rounded-xl px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide transition ${selectedRole === role ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {role}
            </a>
          ))}
        </div>

        {resolvedSearchParams.error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {decodeURIComponent(resolvedSearchParams.error)}
          </div>
        ) : null}
        {resolvedSearchParams.created ? <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Staff account created successfully.</div> : null}

        <form action={signupAction} className="space-y-4">
          <input type="hidden" name="role" value={selectedRole} />

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder="At least 6 characters"
            />
          </div>

          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
            Create account
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Login here
          </a>
        </div>
      </div>
    </main>
  );
}
