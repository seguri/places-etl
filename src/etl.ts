import { resolve } from "node:path";
import { debugExtractedPlaces } from "./debug.js";
import { extractPlaces } from "./extract.js";
import { saveExtractedPlaces } from "./load.js";
import { DOWNLOADS_DIR, isMain } from "./settings.js";
import { promoteExtractedPlaces } from "./transform.js";

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

  // Extract
  const extractedPlaces = await extractPlaces(sourceArchive, sourceFilenames);
  console.log(`Extracted ${extractedPlaces.length} places`);
  debugExtractedPlaces(extractedPlaces);

  // Load
  saveExtractedPlaces(extractedPlaces);

  // Transform
  promoteExtractedPlaces();
}

// Check if this file is being run directly
if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
