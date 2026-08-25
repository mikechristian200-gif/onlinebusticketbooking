import { validateCustomerCredentials, setCustomerSession } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password.trim()) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const customer = await validateCustomerCredentials(email, password);

    if (!customer) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setCustomerSession(customer);

    return Response.json({ success: true, customer }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
