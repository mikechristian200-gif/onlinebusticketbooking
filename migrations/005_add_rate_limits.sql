CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);