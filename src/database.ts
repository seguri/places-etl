import { DatabaseSync } from "node:sqlite";
import { DB_PATH } from "./settings.js";
import type { Archive, ExtractedPlace, ScrapedCoordinate } from "./types.js";

const createTables = `
CREATE TABLE IF NOT EXISTS archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS extracted_places (
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

CREATE TABLE IF NOT EXISTS valid_places (
  cid TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (cid, type)
);

CREATE TABLE IF NOT EXISTS scraped_coordinates (
  cid TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  PRIMARY KEY (cid)
);
`;

const insertArchive = `
INSERT OR IGNORE INTO archives (
  path,
  hash,
  created_at
) VALUES (?, ?, ?);
`;

const findArchiveByHash = `
SELECT * FROM archives WHERE hash = ?;
`;

const insertExtractedPlace = `
INSERT INTO extracted_places (
  cid,
  type,
  name,
  latitude,
  longitude,
  created_at,
  archive_id
) VALUES (?, ?, ?, ?, ?, ?, ?);
`;

const insertScrapedCoordinate = `
INSERT INTO scraped_coordinates (
  cid,
  latitude,
  longitude
) VALUES (?, ?, ?);
`;

/** valid_places' NOT NULL clauses take care of invalid places */
const promoteExtractedPlaces = `
INSERT OR IGNORE INTO valid_places (
  cid,
  type,
  name,
  latitude,
  longitude,
  created_at
)
SELECT
  ep.cid,
  ep.type,
  ep.name,
  COALESCE(sc.latitude, ep.latitude) AS latitude,
  COALESCE(sc.longitude, ep.longitude) AS longitude,
  ep.created_at
FROM
  extracted_places ep
LEFT JOIN
  scraped_coordinates sc ON ep.cid = sc.cid;
`;

const findUnpromotedPlaces = `
SELECT ep.*
FROM extracted_places ep
LEFT JOIN valid_places vp
  ON ep.cid = vp.cid
  AND ep.type = vp.type
WHERE vp.cid IS NULL;
`;

const findPlacesSavedManyTimes = `
SELECT
  archive_id,
  COUNT(*) AS occurrence_count,
  cid,
  name,
  GROUP_CONCAT(type) AS place_types
FROM
  extracted_places
GROUP BY
  archive_id, cid
HAVING
  COUNT(*) > 1
ORDER BY
  archive_id, occurrence_count DESC;
`;

export class Database implements Disposable {
  private db: DatabaseSync;
  private insertExtractedPlaceStmt;
  private insertScrapedCoordinateStmt;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.exec("PRAGMA busy_timeout = 5000;");
    this.exec("PRAGMA journal_mode = WAL;");
    this.exec(createTables);
    this.insertExtractedPlaceStmt = this.db.prepare(insertExtractedPlace);
    this.insertScrapedCoordinateStmt = this.db.prepare(insertScrapedCoordinate);
  }

  [Symbol.dispose](): void {
    this.close();
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  insertArchive(path: string, hash: string, createdAt: Date): Archive {
    const insert = this.db.prepare(insertArchive);
    insert.run(path, hash, createdAt.getTime());

    const select = this.db.prepare(findArchiveByHash);
    const row = select.get(hash) as {
      id: number;
      path: string;
      hash: string;
      created_at: number;
    };

    return {
      id: row.id,
      path: row.path,
      hash: row.hash,
      createdAt: new Date(row.created_at),
    };
  }

  insertExtractedPlace(place: ExtractedPlace): void {
    this.insertExtractedPlaceStmt.run(
      place.cid,
      place.type,
      place.name ?? null,
      place.latitude ?? null,
      place.longitude ?? null,
      place.createdAt.getTime(),
      place.archiveId,
    );
  }

  insertScrapedCoordinate(coordinate: ScrapedCoordinate): void {
    this.insertScrapedCoordinateStmt.run(
      coordinate.cid,
      coordinate.latitude,
      coordinate.longitude,
    );
  }

  insertExtractedPlaces(places: ExtractedPlace[]): void {
    this.doInTransaction(() => {
      let skipped = 0;
      let inserted = 0;
      for (const place of places) {
        try {
          this.insertExtractedPlace(place);
          inserted++;
        } catch (insertError) {
          if (String(insertError).includes("UNIQUE constraint failed")) {
            skipped++;
          } else {
            throw insertError;
          }
        }
      }
      // Use the future tense because the transaction is not committed yet
      console.log(`Inserting ${inserted} places`);
      if (skipped > 0) {
        console.log(`Skipping ${skipped} places`);
      }
    });
  }

  promoteExtractedPlaces(): void {
    const stmt = this.db.prepare(promoteExtractedPlaces);
    this.doInTransaction(() => {
      stmt.run();
    });
  }

  insertScrapedCoordinates(coordinates: ScrapedCoordinate[]): void {
    this.doInTransaction(() => {
      let skipped = 0;
      let inserted = 0;
      for (const coordinate of coordinates) {
        try {
          this.insertScrapedCoordinate(coordinate);
          inserted++;
        } catch (insertError) {
          if (String(insertError).includes("UNIQUE constraint failed")) {
            skipped++;
          } else {
            throw insertError;
          }
        }
      }
      // Use the future tense because the transaction is not committed yet
      console.log(`Inserting ${inserted} coordinates`);
      if (skipped > 0) {
        console.log(`Skipping ${skipped} coordinates`);
      }
    });
  }

  findUnpromotedPlaces(): ExtractedPlace[] {
    const stmt = this.db.prepare(findUnpromotedPlaces);
    return stmt.all() as ExtractedPlace[];
  }

  findPlacesSavedManyTimes(): Record<string, unknown>[] {
    const stmt = this.db.prepare(findPlacesSavedManyTimes);
    return stmt.all() as Record<string, unknown>[];
  }

  private doInTransaction(op: () => void): void {
    try {
      this.exec("BEGIN TRANSACTION;");
      op();
      this.exec("COMMIT;");
    } catch (opError) {
      console.error("Operation failed:", opError);
      try {
        this.exec("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
  }
}
