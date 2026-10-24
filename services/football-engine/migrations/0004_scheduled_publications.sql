-- Additive daily schedule: existing active publications and data remain unchanged.
CREATE TABLE scheduled_publications (
 target_date TEXT PRIMARY KEY,
 version_id TEXT NOT NULL UNIQUE REFERENCES publication_versions(id),
 expected_generation INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','published','blocked','cancelled')),
 created_at TEXT NOT NULL,
 processed_at TEXT,
 detail TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(detail))
);
CREATE INDEX scheduled_publications_status_day ON scheduled_publications(status,target_date);
