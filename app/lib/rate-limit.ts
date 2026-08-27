import { sql } from '@/app/lib/db';

export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await sql`
    INSERT INTO rate_limit_buckets (bucket_key, attempts, window_started_at)
    VALUES (${key}, 1, now())
    ON CONFLICT (bucket_key) DO UPDATE SET
      attempts = CASE
        WHEN rate_limit_buckets.window_started_at <= now() - make_interval(secs => ${windowSeconds}) THEN 1
        ELSE rate_limit_buckets.attempts + 1
      END,
      window_started_at = CASE
        WHEN rate_limit_buckets.window_started_at <= now() - make_interval(secs => ${windowSeconds}) THEN now()
        ELSE rate_limit_buckets.window_started_at
      END
    RETURNING attempts, window_started_at;
  `;
  const row = rows[0];
  const allowed = Number(row.attempts) <= limit;
  const retryAfter = Math.max(1, windowSeconds - Math.floor((Date.now() - new Date(row.window_started_at).getTime()) / 1000));
  return { allowed, retryAfter };
}

export async function clearRateLimit(key: string) {
  await sql`DELETE FROM rate_limit_buckets WHERE bucket_key = ${key};`;
}