import { createCustomerAccount, setCustomerSession } from '@/app/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      return Response.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return Response.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const customer = await createCustomerAccount({
      name,
      email,
      password,
      phone,
    });

    await setCustomerSession(customer);

    return Response.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    const status = message.includes('already exists') ? 409 : 500;
    return Response.json({ error: message }, { status });
  }
}
