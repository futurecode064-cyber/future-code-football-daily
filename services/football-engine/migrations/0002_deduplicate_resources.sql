-- Preserve every existing version while storing unchanged JSON once.
CREATE TABLE resource_blobs (
 digest TEXT PRIMARY KEY,
 body TEXT NOT NULL CHECK(json_valid(body))
);
CREATE TABLE resource_refs (
 version_id TEXT NOT NULL REFERENCES publication_versions(id),
 path TEXT NOT NULL,
 digest TEXT NOT NULL REFERENCES resource_blobs(digest),
 PRIMARY KEY(version_id,path)
);
CREATE INDEX resource_refs_digest ON resource_refs(digest);
INSERT INTO resource_blobs(digest,body) SELECT digest,body FROM resources GROUP BY digest;
INSERT INTO resource_refs(version_id,path,digest) SELECT version_id,path,digest FROM resources;
DROP TABLE resources;
CREATE VIEW resources AS
 SELECT r.version_id,r.path,b.body,r.digest FROM resource_refs r JOIN resource_blobs b ON b.digest=r.digest;
