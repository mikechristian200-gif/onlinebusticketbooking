import {
  createAccount,
  deleteStaffAccount,
  getAllUsers,
  getCurrentUser,
  setSession,
  updateStaffAccount,
  UserRole,
} from '@/app/lib/auth';
import { checkRateLimit } from '@/app/lib/rate-limit';

const ROLES: UserRole[] = ['admin', 'manager', 'driver'];

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { response: Response.json({ error: 'Authentication required' }, { status: 401 }) };
  if (user.role !== 'admin') return { response: Response.json({ error: 'Admin access required' }, { status: 403 }) };
  const limiter = await checkRateLimit(`staff-api:${user.id}`, 60, 60);
  if (!limiter.allowed) return { response: Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(limiter.retryAfter) } }) };
  return { user };
}

function parseInput(body: any) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const role = body.role as UserRole;

  if (!name || !email || !ROLES.includes(role)) {
    throw new Error('Name, email, and a valid role are required.');
  }

  return { name, email, password, role };
}

export async function GET() {
  const access = await requireAdmin();
  if (access.response) return access.response;

  try {
    return Response.json(await getAllUsers());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Failed to load staff.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const access = await requireAdmin();
  if (access.response) return access.response;

  try {
    const input = parseInput(await req.json());
    if (!input.password) throw new Error('Password is required for a new account.');
    return Response.json(await createAccount(input), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create staff account.';
    return Response.json({ error: message }, { status: message.includes('already exists') ? 409 : 400 });
  }
}

export async function PATCH(req: Request) {
  const access = await requireAdmin();
  if (access.response) return access.response;

  try {
    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) throw new Error('Staff account ID is required.');
    const input = parseInput(body);
    if (id === access.user.id && input.role !== 'admin') {
      throw new Error('You cannot remove your own admin access.');
    }

    const updated = await updateStaffAccount({ id, ...input });
    if (id === access.user.id) await setSession(updated);
    return Response.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update staff account.';
    return Response.json({ error: message }, { status: message.includes('not found') ? 404 : message.includes('already exists') ? 409 : 400 });
  }
}

export async function DELETE(req: Request) {
  const access = await requireAdmin();
  if (access.response) return access.response;

  try {
    const id = new URL(req.url).searchParams.get('id')?.trim() ?? '';
    if (!id) throw new Error('Staff account ID is required.');
    if (id === access.user.id) throw new Error('You cannot delete your own account.');
    await deleteStaffAccount(id);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete staff account.';
    return Response.json({ error: message }, { status: message.includes('not found') ? 404 : 400 });
  }
}
