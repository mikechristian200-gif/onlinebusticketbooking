import { validateCustomerCredentials, setCustomerSession } from '@/app/lib/auth';
import { checkRateLimit, clearRateLimit } from '@/app/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password.trim()) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const loginLimit = await checkRateLimit(`customer-login:${normalizedEmail}`, 5, 900);
    if (!loginLimit.allowed) return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(loginLimit.retryAfter) } });

    const customer = await validateCustomerCredentials(email, password);

    if (!customer) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setCustomerSession(customer);
    await clearRateLimit(`customer-login:${normalizedEmail}`);

    return Response.json({ success: true, customer }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
