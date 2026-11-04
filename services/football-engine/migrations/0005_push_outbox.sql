-- Additive only. Never changes existing publication tables or old Android installs.
CREATE TABLE IF NOT EXISTS notification_outbox (
 id TEXT PRIMARY KEY,
 brand TEXT NOT NULL,
 editorial_date TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('morning','afternoon')),
 version_id TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('reserved','sent','failed')),
 created_at TEXT NOT NULL,
 completed_at TEXT,
 fcm_message_id TEXT,
 error TEXT,
 UNIQUE(brand, editorial_date, kind)
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_day ON notification_outbox(editorial_date,status);
