import { deliverPendingReminders, queueDepartureReminders } from '@/app/lib/notification-service';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

async function run(request: Request) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const queued = await queueDepartureReminders();
    const delivered = await deliverPendingReminders();
    return Response.json({ ok: true, queued, delivered });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Reminder worker failed' }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
