import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/app/lib/db';

export type UserRole = 'admin' | 'manager' | 'driver';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const SESSION_COOKIE = 'golden_express_session';
const SESSION_SECRET = process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'golden-express-development-secret');

const DEVELOPMENT_USERS = [
  {
    name: 'Company Admin',
    email: 'admin@goldenexpress.cm',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Operations Manager',
    email: 'manager@goldenexpress.cm',
    password: 'manager123',
    role: 'manager',
  },
  {
    name: 'Bus Driver',
    email: 'driver@goldenexpress.cm',
    password: 'driver123',
    role: 'driver',
  },
] as const;

function getInitialUsers() {
  if (process.env.NODE_ENV !== 'production') return DEVELOPMENT_USERS;
  if (!process.env.INITIAL_ADMIN_EMAIL || !process.env.INITIAL_ADMIN_PASSWORD) return [];
  return [{
    name: process.env.INITIAL_ADMIN_NAME || 'Company Admin',
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD,
    role: 'admin' as const,
  }];
}

function hashPassword(password: string) {
  return crypto.pbkdf2Sync(password, 'golden-express-salt', 100000, 64, 'sha512').toString('hex');
}

function signSession(payload: string) {
  if (!SESSION_SECRET) {
    throw new Error('AUTH_SECRET must be configured in production.');
  }
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function encodeSession(value: unknown) {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${payload}.${signSession(payload)}`;
}

function decodeSession<T>(value: string): T | null {
  try {
    const [payload, signature] = value.split('.');
    if (!payload || !signature) return null;
    const expected = signSession(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export async function getAllUsers() {
  const rows = await sql`SELECT id, name, email, role FROM staff_users ORDER BY name ASC;`;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRole,
  }));
}

export async function createAccount(input: { name: string; email: string; password: string; role: UserRole }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!name || !email || !password) {
    throw new Error('All fields are required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const existing = await sql`
    SELECT id FROM staff_users WHERE email = ${email} LIMIT 1;
  `;

  if (existing[0]) {
    throw new Error('An account with this email already exists.');
  }

  const rows = await sql`
    INSERT INTO staff_users (name, email, password_hash, role, role_id)
    VALUES (${name}, ${email}, ${hashPassword(password)}, ${input.role}, ${input.role})
    RETURNING id, name, email, role;
  `;

  const user = rows[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  } satisfies AppUser;
}

export async function validateCredentials(email: string, password: string): Promise<AppUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await sql`
    SELECT id, name, email, role, password_hash
    FROM staff_users
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `;

  const match = rows[0];
  if (!match) {
    return null;
  }

  const passwordMatches = crypto.timingSafeEqual(
    Buffer.from(hashPassword(password), 'hex'),
    Buffer.from(match.password_hash, 'hex'),
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: match.id,
    name: match.name,
    email: match.email,
    role: match.role as UserRole,
  };
}

export function getDashboardRoute(role: UserRole) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'manager':
      return '/manager';
    case 'driver':
      return '/driver';
    default:
      return '/login';
  }
}

export async function setSession(user: AppUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return decodeSession<AppUser>(sessionCookie);
  } catch {
    return null;
  }
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await getCurrentUser();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!user || !allowedRoles.includes(user.role)) {
    redirect('/login');
  }

  return user;
}

// ============= CUSTOMER AUTHENTICATION =============

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

const CUSTOMER_SESSION_COOKIE = 'golden_express_customer_session';

export async function createCustomerAccount(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<Customer> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();
  const phone = input.phone.trim();

  if (!name || !email || !password || !phone) {
    throw new Error('Name, email, password, and phone number are required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (phone.length < 7) {
    throw new Error('Phone number must be at least 7 characters long.');
  }

  const existing = await sql`
    SELECT id FROM customers WHERE email = ${email} LIMIT 1;
  `;

  if (existing[0]) {
    throw new Error('An account with this email already exists.');
  }

  const rows = await sql`
    INSERT INTO customers (name, email, password_hash, phone)
    VALUES (${name}, ${email}, ${hashPassword(password)}, ${phone})
    RETURNING id, name, email, phone;
  `;

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    phone: rows[0].phone,
  };
}

export async function validateCustomerCredentials(
  email: string,
  password: string,
): Promise<Customer | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await sql`
    SELECT id, name, email, phone, password_hash
    FROM customers
    WHERE email = ${normalizedEmail}
    LIMIT 1;
  `;

  const match = rows[0];
  if (!match) {
    return null;
  }

  const passwordMatches = crypto.timingSafeEqual(
    Buffer.from(hashPassword(password), 'hex'),
    Buffer.from(match.password_hash, 'hex'),
  );

  if (!passwordMatches) {
    return null;
  }

  return {
    id: match.id,
    name: match.name,
    email: match.email,
    phone: match.phone,
  };
}

export async function setCustomerSession(customer: Customer) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, encodeSession(customer), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days for customer sessions
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    return decodeSession<Customer>(sessionCookie);
  } catch {
    return null;
  }
}

export async function requireCustomerAuth() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    redirect('/customer-login');
  }

  return customer;
}
