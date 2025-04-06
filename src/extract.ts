import { debugExtractedPlaces } from "./debug.js";
import type { Archive, ExtractedPlace } from "./types.js";
import { extractPlacesFromArchive } from "./unarchive.js";

export const extractPlaces = async (
  sourceArchive: Archive,
  sourceFilenames: string[],
): Promise<ExtractedPlace[]> => {
  const extractionPromises = sourceFilenames.map((sourceFilename) =>
    extractPlacesFromArchive(sourceArchive, sourceFilename),
  );
  const extractedPlacesArray = await Promise.all(extractionPromises);
  const extractedPlaces = extractedPlacesArray.flat();

  debugExtractedPlaces(extractedPlaces);

  return extractedPlaces;
};
