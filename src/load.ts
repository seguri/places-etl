import { Database } from "./database.js";
import type { ExtractedPlace } from "./types.js";

export const saveExtractedPlaces = async (
  extractedPlaces: ExtractedPlace[],
): Promise<void> => {
  console.log("--------------------------------");
  console.log("Saving extracted places");
  using db = new Database();
  db.insertExtractedPlaces(extractedPlaces);
};
