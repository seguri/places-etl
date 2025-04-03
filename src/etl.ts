import { resolve } from "node:path";
import { Database } from "./database.js";
import { debugExtractedPlaces } from "./debug.js";
import { DOWNLOADS_DIR, isMain } from "./settings.js";
import { extractPlacesFromArchive } from "./unarchive.js";

async function main() {
  // Input
  const sourceArchive = resolve(
    DOWNLOADS_DIR,
    "takeout-20250325T224539Z-001.zip",
  );
  const sourceFilenames = [
    "Saved Places.json",
    "Favourite places.csv",
    "Want to go.csv",
  ];

  // Database
  using db = new Database();

  // Extract
  const extractionPromises = sourceFilenames.map((sourceFilename) =>
    extractPlacesFromArchive(sourceArchive, sourceFilename),
  );
  const extractedPlacesArray = await Promise.all(extractionPromises);
  const extractedPlaces = extractedPlacesArray.flat();
  console.log(`Extracted ${extractedPlaces.length} places`);
  debugExtractedPlaces(extractedPlaces);

  // Load
  db.insertExtractedPlaces(extractedPlaces);
}

// Check if this file is being run directly
if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
