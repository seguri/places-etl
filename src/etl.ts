import { resolve } from "node:path";
import { DOWNLOADS_DIR, isMain } from "./settings.js";
import { extractPlacesFromArchive } from "./unarchive.js";

async function main() {
  const sourceArchive = resolve(
    DOWNLOADS_DIR,
    "takeout-20250325T224539Z-001.zip",
  );
  const sourceFilenames = [
    "Saved Places.json",
    "Favourite places.csv",
    "Want to go.csv",
  ];
  for (const sourceFilename of sourceFilenames) {
    const extractedPlaces = await extractPlacesFromArchive(
      sourceArchive,
      sourceFilename,
    );
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
