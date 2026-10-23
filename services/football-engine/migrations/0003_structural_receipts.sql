-- Cache server structural checks with each immutable content digest. No source bodies change.
ALTER TABLE resource_blobs ADD COLUMN structural_errors TEXT CHECK(structural_errors IS NULL OR json_valid(structural_errors));
ALTER TABLE resource_blobs ADD COLUMN structural_revision INTEGER NOT NULL DEFAULT 0;
