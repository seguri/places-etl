import { DEBUG } from "./settings.js";
import type { ExtractedPlace } from "./types.js";

export const debugExtractedObjects = (
  sourceFilename: string,
  objects: object[],
  validObjects: object[],
) => {
  console.log("--------------------------------");
  console.log(`${sourceFilename}: ${objects.length} objects`);
  console.log(`${sourceFilename}: ${validObjects.length} valid objects`);
};

export const debugExtractedPlaces = (extractedPlaces: ExtractedPlace[]) => {
  console.log("--------------------------------");
  console.log(`Extracted ${extractedPlaces.length} places`);
  console.log("--------------------------------");
  let withoutName = 0;
  let withoutCoordinates = 0;
  if (DEBUG) {
    console.log("Places without a name:");
  }
  for (const place of extractedPlaces) {
    if (!place.name) {
      withoutName++;
      if (DEBUG) {
        console.log(
          place.cid,
          place.type,
          `https://maps.google.com/?cid=${place.cid}`,
          `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`,
        );
      }
    }
  }
  if (DEBUG) {
    console.log("Places without a latitude or longitude:");
  }
  for (const place of extractedPlaces) {
    if (!place.latitude || !place.longitude) {
      withoutCoordinates++;
      if (DEBUG) {
        console.log(
          place.cid,
          place.type,
          place.name,
          `https://maps.google.com/?cid=${place.cid}`,
        );
      }
    }
  }
  if (DEBUG) {
    console.log("--------------------------------");
  }
  console.log(`${withoutName} places without a name`);
  console.log(`${withoutCoordinates} places without coordinates`);
};
