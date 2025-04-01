import { resolve } from "node:path";
import { DOWNLOADS_DIR, isMain } from "./settings.js";
import { readGeoJsonFromArchive } from "./unarchive.js";

async function main() {
  const archivePath = resolve(
    DOWNLOADS_DIR,
    "takeout-20250325T224539Z-001.zip",
  );
  const filenames = [
    "Saved Places.json",
    "Favourite places.csv",
    "Want to go.csv",
  ];
  for (const filename of filenames) {
    const json = await readGeoJsonFromArchive(archivePath, filename);
    // TODO: Store extracted data in sqlite database
  }
}

// Check if this file is being run directly
if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
