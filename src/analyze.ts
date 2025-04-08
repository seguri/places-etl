import { Database } from "./database.js";
import { isMain } from "./settings.js";

async function main() {
  using db = new Database();
  const unpromotedPlaces = db.findUnpromotedPlaces();
  console.log("--------------------------------");
  console.log(`${unpromotedPlaces.length} unpromoted places:`);
  console.table(
    unpromotedPlaces.map((place) => ({
      cid: `https://maps.google.com/?cid=${place.cid}`,
      type: place.type,
      name: place.name?.substring(0, 30) || "n/a",
      latitude: place.latitude || "n/a",
      longitude: place.longitude || "n/a",
    })),
  );

  console.log("--------------------------------");
  const placesSavedManyTimes = db.findPlacesSavedManyTimes();
  console.log(`${placesSavedManyTimes.length} places saved many times:`);
  console.table(
    placesSavedManyTimes.map((row) => ({
      archive_id: row.archive_id,
      occurrence_count: row.occurrence_count,
      cid: `https://maps.google.com/?cid=${row.cid}`,
      name: (row.name as string)?.substring(0, 30) || "n/a",
      types: row.place_types,
    })),
  );
}

// Check if this file is being run directly
if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
