'use client';

export default function PrintTicketButton() {
  return (
    <button onClick={() => window.print()} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700">
      Print ticket
    </button>
  );
}
