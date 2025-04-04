import { Database } from "./database.js";
import type { ExtractedPlace } from "./types.js";

export const saveExtractedPlaces = async (
  extractedPlaces: ExtractedPlace[],
): Promise<void> => {
  using db = new Database();
  db.insertExtractedPlaces(extractedPlaces);
};
