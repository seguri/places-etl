import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import { Database } from "./database.js";
import type { Archive } from "./types.js";

export const saveArchive = (archivePath: string): Archive => {
  const hash = sha256(archivePath);
  const createdAt = parseArchiveTimestamp(archivePath);

  using db = new Database();
  const saved = db.insertArchive(archivePath, hash, createdAt);

  return saved;
};

const sha256 = (path: string) => {
  const fileBuffer = readFileSync(path);
  return createHash("sha256").update(fileBuffer).digest("hex");
};

const parseArchiveTimestamp = (sourceArchive: string): Date => {
  const match = sourceArchive.match(/takeout-(\d{8}T\d{6}Z)/);
  if (!match) {
    throw new Error(
      `${sourceArchive}: could not find a validtimestamp in the archive filename`,
    );
  }
  return DateTime.fromISO(match[1], { zone: "utc" }).toJSDate();
};
