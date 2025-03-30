import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonFromArchive } from "./unarchive.js";

async function main() {
  const archivePath = resolve(
    homedir(),
    "Downloads/takeout-20250325T224539Z-001.zip",
  );
  const filenames = [
    "Saved Places.json",
    "Favourite places.csv",
    "Want to go.csv",
  ];
  for (const filename of filenames) {
    const json = await readJsonFromArchive(archivePath, filename);
    // TODO: Store extracted data in sqlite database
  }
}

// Normalize `import.meta.url` and `process.argv[1]`
const thisFilePath = fileURLToPath(import.meta.url);

// Check if this file is being run directly
if (thisFilePath === resolve(process.argv[1])) {
  main().catch((err) => {
    console.error("Unhandled error in main:", err);
    process.exit(1);
  });
}
