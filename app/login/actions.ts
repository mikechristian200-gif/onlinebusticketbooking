'use server';

import { redirect } from 'next/navigation';
import { createAccount, getCurrentUser, getDashboardRoute, setSession, validateCredentials } from '@/app/lib/auth';
import { checkRateLimit, clearRateLimit } from '@/app/lib/rate-limit';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'admin') as 'admin' | 'manager' | 'driver';
  const loginLimit = await checkRateLimit(`staff-login:${email}`, 5, 900);
  if (!loginLimit.allowed) redirect(`/login?role=${role}&error=too_many_attempts`);

  const user = await validateCredentials(email, password);

  if (!user) {
    redirect(`/login?role=${role}&error=invalid`);
  }

  await setSession(user);
  await clearRateLimit(`staff-login:${email}`);
  redirect(getDashboardRoute(user.role));
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '').trim();
  const requestedRole = String(formData.get('role') ?? 'manager');
  const role = requestedRole === 'driver' ? 'driver' : 'manager';
  const signupLimit = await checkRateLimit(`staff-signup:${email}`, 3, 3600);
  if (!signupLimit.allowed) redirect(`/signup?role=${role}&error=too_many_attempts`);

  const currentUser = await getCurrentUser();
  const publicSignupAllowed = process.env.ALLOW_PUBLIC_STAFF_SIGNUP === 'true' && process.env.NODE_ENV === 'production';
  if (currentUser?.role !== 'admin' && !publicSignupAllowed) {
    redirect('/login?error=staff_signup_disabled');
  }

  try {
    const user = await createAccount({ name, email, password, role });
    if (publicSignupAllowed) {
      await setSession(user);
      redirect(getDashboardRoute(user.role));
    }
    redirect('/signup?created=1');
  } catch (error) {
    redirect(`/signup?role=${role}&error=${encodeURIComponent(error instanceof Error ? error.message : 'signup_failed')}`);
  }
}

export async function logoutAction() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.delete('golden_express_session');
  redirect('/login');
}
