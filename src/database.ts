import { DatabaseSync } from "node:sqlite";
import { DB_PATH } from "./settings.js";
import type { ExtractedPlace } from "./types.js";

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
`;

const insertPlace = `
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

const placeAlreadyExists = (error: unknown): boolean => {
  return String(error).includes(
    "UNIQUE constraint failed: extracted_places.cid, extracted_places.type",
  );
};

export class Database implements Disposable {
  private db: DatabaseSync;
  private insertPlaceStmt;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.exec("PRAGMA busy_timeout = 5000;");
    this.exec("PRAGMA journal_mode = WAL;");
    this.exec(createTables);
    this.insertPlaceStmt = this.db.prepare(insertPlace);
  }

  [Symbol.dispose](): void {
    this.close();
  }

  // Close the database connection
  close(): void {
    if (this.db) {
      this.db.close();
    }
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  insertPlace(place: ExtractedPlace): void {
    this.insertPlaceStmt.run(
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

  insertPlaces(places: ExtractedPlace[]): void {
    let inserted = 0;
    let skipped = 0;
    try {
      this.exec("BEGIN TRANSACTION;");
      for (const place of places) {
        try {
          this.insertPlace(place);
          inserted++;
        } catch (insertError) {
          if (placeAlreadyExists(insertError)) {
            skipped++;
          } else {
            throw insertError;
          }
        }
      }
      this.exec("COMMIT;");
      console.log(`Inserted ${inserted} places`);
      if (skipped > 0) {
        console.log(`Skipped ${skipped} places`);
      }
    } catch (transactionError) {
      console.error("Transaction failed:", transactionError);
      try {
        this.exec("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
  }
}
