import { clearCustomerSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export async function POST() {
  try {
    await clearCustomerSession();
    redirect('/customer-login');
  } catch (error) {
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}
