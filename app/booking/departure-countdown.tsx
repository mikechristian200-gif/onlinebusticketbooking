'use client';

import { useEffect, useMemo, useState } from 'react';

function getDepartureDate(date: string, time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  const departure = new Date(`${date}T00:00:00`);
  departure.setHours(hours, Number(match[2]), 0, 0);
  return departure;
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function DepartureCountdown({ date, departure, reference }: { date: string; departure: string; reference: string }) {
  const departureDate = useMemo(() => getDepartureDate(date, departure), [date, departure]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);

  useEffect(() => {
    if (!departureDate) return;
    const update = () => setRemaining(departureDate.getTime() - Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [departureDate]);

  useEffect(() => {
    if (remaining === null || remaining <= 0 || remaining > 60 * 60 * 1000 || Notification.permission !== 'granted') return;
    const alertKey = `departure-alert:${reference}`;
    if (window.localStorage.getItem(alertKey)) return;
    new Notification('Your Golden Express trip is soon', { body: `Booking ${reference} departs in less than one hour.` });
    window.localStorage.setItem(alertKey, 'sent');
  }, [remaining, reference]);

  const enableAlerts = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setAlertsEnabled(permission === 'granted');
  };

  if (!departureDate || remaining === null) {
    return <p className="text-sm text-slate-500">Departure time unavailable.</p>;
  }

  if (remaining <= 0) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm font-bold text-slate-700">This trip has departed.</div>;
  }

  const time = formatRemaining(remaining);
  const urgent = remaining <= 60 * 60 * 1000;

  return (
    <div className={`rounded-3xl border p-5 ${urgent ? 'border-orange-300 bg-orange-50' : 'border-[#bedbd0] bg-[#edf8f3]'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.2em] ${urgent ? 'text-orange-700' : 'text-emerald-700'}`}>{urgent ? 'Departure soon' : 'Time until departure'}</p>
          <div className="mt-3 flex items-end gap-2 text-[#102a43]">
            {time.days > 0 ? <TimeBlock value={time.days} label="days" /> : null}
            <TimeBlock value={time.hours} label="hours" />
            <TimeBlock value={time.minutes} label="min" />
            <TimeBlock value={time.seconds} label="sec" />
          </div>
          <p className="mt-3 text-sm text-slate-600">Departure: {date} at {departure}</p>
        </div>
        {'Notification' in window && Notification.permission !== 'denied' ? (
          <button type="button" onClick={enableAlerts} className="rounded-xl bg-[#102a43] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e85d3f]">
            {alertsEnabled || Notification.permission === 'granted' ? 'Alerts enabled' : 'Enable alerts'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return <span className="text-center"><strong className="block text-3xl font-black tabular-nums sm:text-4xl">{String(value).padStart(2, '0')}</strong><small className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</small></span>;
}
