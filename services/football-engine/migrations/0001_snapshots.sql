PRAGMA foreign_keys = ON;
CREATE TABLE publication_versions (
 id TEXT PRIMARY KEY, parent_id TEXT REFERENCES publication_versions(id),
 editorial_date TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
 input_hash TEXT NOT NULL, source_manifest TEXT NOT NULL CHECK(json_valid(source_manifest)),
 created_at TEXT NOT NULL, validated_at TEXT, ever_published INTEGER NOT NULL DEFAULT 0 CHECK(ever_published IN (0,1))
);
CREATE INDEX publications_day ON publication_versions(editorial_date,created_at);
CREATE TABLE resources (
 version_id TEXT NOT NULL REFERENCES publication_versions(id), path TEXT NOT NULL,
 body TEXT NOT NULL CHECK(json_valid(body)), digest TEXT NOT NULL,
 PRIMARY KEY(version_id,path)
);
CREATE TABLE active_publication (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1), version_id TEXT REFERENCES publication_versions(id),
 generation INTEGER NOT NULL DEFAULT 0, changed_at TEXT
);
INSERT INTO active_publication(singleton) VALUES(1);
CREATE TABLE validation_reviews (
 version_id TEXT PRIMARY KEY REFERENCES publication_versions(id),
 evidence TEXT NOT NULL CHECK(json_valid(evidence)), reviewed_at TEXT NOT NULL
);
CREATE TABLE audit_logs (
 id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, version_id TEXT REFERENCES publication_versions(id),
 generation INTEGER, created_at TEXT NOT NULL, detail TEXT NOT NULL CHECK(json_valid(detail))
);
-- Force the entire publish batch to roll back on a stale generation or failed validation.
CREATE TRIGGER publication_guard BEFORE UPDATE ON active_publication
WHEN NEW.version_id IS NOT NULL
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM publication_versions WHERE id=NEW.version_id AND validated_at IS NOT NULL)
 THEN RAISE(ABORT,'publication_not_validated') END;
END;
-- All publication transitions, including rollback, are audited atomically with the pointer.
CREATE TRIGGER publication_audit AFTER UPDATE ON active_publication
BEGIN
 UPDATE publication_versions SET ever_published=1 WHERE id=NEW.version_id;
 INSERT INTO audit_logs(action,version_id,generation,created_at,detail)
 VALUES('activate',NEW.version_id,NEW.generation,NEW.changed_at,json_object('previous',OLD.version_id));
END;
