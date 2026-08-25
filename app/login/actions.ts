'use server';

import { redirect } from 'next/navigation';
import { createAccount, getCurrentUser, getDashboardRoute, setSession, validateCredentials } from '@/app/lib/auth';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? 'admin') as 'admin' | 'manager' | 'driver';

  const user = await validateCredentials(email, password);

  if (!user) {
    redirect(`/login?role=${role}&error=invalid`);
  }

  await setSession(user);
  redirect(getDashboardRoute(user.role));
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '').trim();
  const role = String(formData.get('role') ?? 'admin') as 'admin' | 'manager' | 'driver';

  const currentUser = await getCurrentUser();
  const publicSignupAllowed = process.env.ALLOW_PUBLIC_STAFF_SIGNUP === 'true' || process.env.NODE_ENV !== 'production';
  if (!publicSignupAllowed && currentUser?.role !== 'admin') {
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
