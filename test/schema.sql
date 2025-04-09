.mode column
.headers on

DROP TABLE IF EXISTS archives;
CREATE TABLE archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

DROP TABLE IF EXISTS extracted_places;
CREATE TABLE extracted_places (
  cid TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT,
  latitude REAL,
  longitude REAL,
  created_at INTEGER NOT NULL,
  archive_id INTEGER NOT NULL,
  PRIMARY KEY (cid, type, archive_id),
  FOREIGN KEY (archive_id) REFERENCES archives(id)
);

DROP TABLE IF EXISTS scraped_coordinates;
CREATE TABLE scraped_coordinates (
  cid TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  PRIMARY KEY (cid)
);

DROP TABLE IF EXISTS valid_places;
CREATE TABLE valid_places (
  cid TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  PRIMARY KEY (cid, type)
);
