import Link from 'next/link';
import { logoutAction } from '@/app/login/actions';
import type { UserRole } from '@/app/lib/auth';

const navigation: Record<UserRole, Array<{ label: string; href: string }>> = {
  admin: [
    { label: 'Overview', href: '/admin' },
    { label: 'Bookings', href: '/admin/bookings' },
    { label: 'Routes', href: '/admin/routes' },
    { label: 'Fleet', href: '/admin/buses' },
    { label: 'Staff', href: '/admin/staff' },
  ],
  manager: [
    { label: 'Overview', href: '/manager' },
    { label: 'Bookings', href: '/admin/bookings' },
    { label: 'Routes', href: '/admin/routes' },
    { label: 'Fleet', href: '/admin/buses' },
  ],
  driver: [{ label: 'Today', href: '/driver' }],
};

export default function OperationsShell({
  user,
  eyebrow,
  title,
  description,
  children,
}: {
  user: { name: string; role: UserRole };
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#eef3f1] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[230px_1fr]">
        <aside className="hidden border-r border-slate-200/80 bg-white/80 px-5 py-7 backdrop-blur lg:block">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e85d3f] text-lg font-black text-white shadow-lg shadow-orange-200">G</span>
            <span><span className="block text-sm font-black tracking-tight text-slate-900">Golden Express</span><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Operations</span></span>
          </Link>
          <nav className="mt-12 space-y-1">
            {navigation[user.role].map((item, index) => (
              <Link key={item.href} href={item.href} className={`block rounded-xl px-3 py-3 text-sm font-semibold transition ${index === 0 ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto pt-24">
            <Link href="/booking" className="block rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-center text-sm font-bold text-orange-700 transition hover:bg-orange-100">Open booking site</Link>
            <form action={logoutAction} className="mt-4"><button className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900">Log out</button></form>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-4 sm:px-7 sm:py-7 lg:px-10">
          <header className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-7 text-white shadow-2xl shadow-slate-300 sm:px-9 sm:py-10">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/70 to-slate-900/20" />
            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">{eyebrow}</p>
                <h1 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">{description}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm"><span className="block text-xs text-slate-300">Signed in as</span><span className="font-bold">{user.name}</span></div>
            </div>
          </header>
          <nav className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 lg:hidden">
            {navigation[user.role].map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">{item.label}</Link>)}
          </nav>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
