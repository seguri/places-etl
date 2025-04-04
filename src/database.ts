import { DatabaseSync } from "node:sqlite";
import { DB_PATH } from "./settings.js";
import type { ExtractedPlace, ScrapedCoordinate, ValidPlace } from "./types.js";

const createTables = `
CREATE TABLE IF NOT EXISTS extracted_places (
  cid TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT,
  latitude REAL,
  longitude REAL,
  source_archive TEXT NOT NULL,
  source_file TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (cid, type)
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

const insertExtractedPlace = `
INSERT INTO extracted_places (
  cid,
  type,
  name,
  latitude,
  longitude,
  source_archive,
  source_file,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

const insertValidPlace = `
INSERT INTO valid_places (
  cid,
  type,
  name,
  latitude,
  longitude,
  created_at
) VALUES (?, ?, ?, ?, ?, ?);
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
  COALESCE(ep.latitude, sc.latitude) AS latitude,
  COALESCE(ep.longitude, sc.longitude) AS longitude,
  ep.created_at
FROM
  extracted_places ep
LEFT JOIN
  scraped_coordinates sc ON ep.cid = sc.cid;
`;

export class Database implements Disposable {
  private db: DatabaseSync;
  private insertExtractedPlaceStmt;
  private insertValidPlaceStmt;
  private insertScrapedCoordinateStmt;
  private promoteExtractedPlacesStmt;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.exec("PRAGMA busy_timeout = 5000;");
    this.exec("PRAGMA journal_mode = WAL;");
    this.exec(createTables);
    this.insertExtractedPlaceStmt = this.db.prepare(insertExtractedPlace);
    this.insertValidPlaceStmt = this.db.prepare(insertValidPlace);
    this.insertScrapedCoordinateStmt = this.db.prepare(insertScrapedCoordinate);
    this.promoteExtractedPlacesStmt = this.db.prepare(promoteExtractedPlaces);
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

  insertExtractedPlace(place: ExtractedPlace): void {
    this.insertExtractedPlaceStmt.run(
      place.cid,
      place.type,
      place.name ?? null,
      place.latitude ?? null,
      place.longitude ?? null,
      place.sourceArchive,
      place.sourceFile,
      place.createdAt.getTime(),
    );
  }

  insertValidPlace(place: ValidPlace): void {
    this.insertValidPlaceStmt.run(
      place.cid,
      place.type,
      place.name,
      place.latitude,
      place.longitude,
      place.createdAt.getTime(),
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
    this.doInTransaction(() => {
      this.promoteExtractedPlacesStmt.run();
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
