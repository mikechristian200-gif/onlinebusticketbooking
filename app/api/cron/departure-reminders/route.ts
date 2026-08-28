import { queueDepartureReminders, sendPendingEmails } from '@/app/lib/notification-service';

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const queued = await queueDepartureReminders();
    const delivered = await sendPendingEmails();
    return Response.json({ ok: true, queued, delivered });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Email worker failed' }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;