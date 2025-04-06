import { Database } from "./database.js";
import { isMain } from "./settings.js";

async function main() {
  using db = new Database();
  const unpromotedPlaces = db.findUnpromotedPlaces();
  console.log("--------------------------------");
  console.log(`${unpromotedPlaces.length} unpromoted places:`);
  const tableData = unpromotedPlaces.map((place) => ({
    cid: `https://maps.google.com/?cid=${place.cid}`,
    type: place.type,
    name: place.name?.substring(0, 30) || "n/a",
    latitude: place.latitude || "n/a",
    longitude: place.longitude || "n/a",
  }));

  console.table(tableData);
}

// Check if this file is being run directly
if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
