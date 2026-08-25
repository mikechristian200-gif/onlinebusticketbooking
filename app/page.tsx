import Link from 'next/link';
import { ArrowRightIcon, MapPinIcon, PhoneIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/outline';

const services = [
  {
    title: 'City-to-city travel',
    description: 'Comfortable daily buses for commuters, students, and travelers between major Southwest towns.',
  },
  {
    title: 'Corporate bookings',
    description: 'Flexible group ticketing for teams, schools, and organizations needing reliable transport.',
  },
  {
    title: 'On-time departures',
    description: 'We prioritize punctual schedules, clear booking confirmations, and support at every stage.',
  },
];

const travelHighlights = [
  'Wi-Fi enabled coaches',
  'Air-conditioned seating',
  'Secure and verified bookings',
  'Friendly local support',
];

const imageUrls = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=900&q=80',
];

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xl font-bold tracking-wide">Golden Express</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Cameroon transport</p>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-200 md:flex">
            <Link href="#about">About us</Link>
            <Link href="#services">Our services</Link>
            <Link href="#contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Book now
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Safe. Local. Reliable.
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
              Travel across the Southwest with confidence.
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-200 md:text-lg">
              Golden Express helps travelers book dependable bus routes between major towns in Cameroon with transparent pricing, comfortable seats, and smooth service.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400"
              >
                Search routes
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Staff login
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login?role=admin" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/15">Admin login</Link>
              <Link href="/login?role=manager" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/15">Manager login</Link>
              <Link href="/login?role=driver" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/15">Driver login</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-blue-300" />
                Verified routes
              </div>
              <div className="flex items-center gap-2">
                <StarIcon className="h-5 w-5 text-yellow-300" />
                Trusted by commuters
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <img src={imageUrls[0]} alt="Bus traveling through a scenic route" className="h-64 w-full rounded-3xl object-cover shadow-2xl sm:h-80" />
            <img src={imageUrls[1]} alt="Passengers boarding a bus" className="h-64 w-full rounded-3xl object-cover shadow-2xl sm:mt-10 sm:h-80" />
            <div className="sm:col-span-2">
              <img src={imageUrls[2]} alt="Comfortable coach interior" className="h-56 w-full rounded-3xl object-cover shadow-2xl sm:h-72" />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">About us</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">A local transport partner built around convenience.</h2>
            <p className="mt-4 text-lg text-slate-600">
              Golden Express was created to make regional travel easier for families, commuters, and travelers in Cameroon. We focus on transparent booking, dependable schedules, and comfortable journeys between towns and cities.
            </p>
            <p className="mt-4 text-slate-600">
              Whether you are traveling for business, school, or leisure, our service keeps your trip simple from search to departure.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Coverage</p>
                <p className="text-xl font-semibold text-slate-900">Southwest region</p>
              </div>
            </div>

            <ul className="mt-6 space-y-4 text-slate-700">
              {travelHighlights.map((item) => (
                <li key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Our services</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Everything you need for smooth travel.</h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="mb-4 inline-flex rounded-2xl bg-blue-100 p-3 text-blue-700">
                  <StarIcon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-3 text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-slate-900 px-6 py-8 text-white md:px-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Contact</p>
              <h2 className="mt-3 text-3xl font-bold">Need help with your next trip?</h2>
              <p className="mt-4 max-w-md text-slate-300">
                Reach out to our team for route information, travel support, or corporate transport assistance.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/5 p-4">
                <PhoneIcon className="h-5 w-5 text-blue-300" />
                <p className="mt-3 font-semibold text-white">Call us</p>
                <p className="mt-1">671985280</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <MapPinIcon className="h-5 w-5 text-blue-300" />
                <p className="mt-3 font-semibold text-white">Visit us</p>
                <p className="mt-1">Buea, Southwest Region</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Golden Express. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#about">About</Link>
            <Link href="#services">Services</Link>
            <Link href="#contact">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
