import { text } from "node:stream/consumers";
import * as csv from "@fast-csv/parse";
import { DateTime } from "luxon";
import yauzl from "yauzl-promise";
import { debugExtractedObjects } from "./debug.js";
import type { ExtractedPlace } from "./types.js";

const GOOGLE_MAPS_URL_HEX_REGEX = /(?:0x[0-9a-f]+):(0x[0-9a-f]+)$/;

interface ArchiveExtractor {
  canHandle(sourceArchive: string): boolean;
  extract(sourceArchive: string, sourceFilename: string): Promise<string>;
}

/** Converts file content to ExtractedPlace[] */
interface FileConverter {
  canHandle(filename: string): boolean;
  convertToExtractedPlaces(
    content: string,
    sourceArchive: string,
    sourceFilename: string,
  ): Promise<ExtractedPlace[]>;
}

/** How data looks like when extracted from a GeoJSON file */
interface GeoJSONFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    google_maps_url: string;
    location: {
      name: string;
    };
  };
}

/** How data looks like when extracted from a CSV file */
interface CsvRow {
  Title: string;
  Note: string;
  URL: string;
  Comment: string;
}

const parseArchiveTimestamp = (sourceArchive: string): Date => {
  const match = sourceArchive.match(/takeout-(\d{8}T\d{6}Z)/);
  if (!match) {
    throw new Error(
      `${sourceArchive}: could not find a validtimestamp in the archive filename`,
    );
  }
  return DateTime.fromISO(match[1], { zone: "utc" }).toJSDate();
};

const getPlaceType = (filename: string) => {
  if (filename.includes("Saved Places")) {
    return "saved";
  }
  if (filename.includes("Favourite places")) {
    return "favourite";
  }
  if (filename.includes("Want to go")) {
    return "wishlist";
  }
  throw new Error(`${filename}: cannot find a corresponding place type`);
};

class ZipExtractor implements ArchiveExtractor {
  canHandle(archivePath: string): boolean {
    return archivePath.endsWith(".zip");
  }

  async extract(archivePath: string, filename: string): Promise<string> {
    const zip = await yauzl.open(archivePath);
    try {
      for await (const entry of zip) {
        if (entry.filename.endsWith(filename)) {
          const stream = await entry.openReadStream();
          const content = await text(stream);
          return content;
        }
      }
      throw new Error(`'${filename}': no such file inside '${archivePath}'`);
    } finally {
      await zip.close();
    }
  }
}

/** JSON files inside google takeout archive are already in GeoJSON format */
class JsonConverter implements FileConverter {
  canHandle(fileName: string): boolean {
    return fileName.endsWith(".json");
  }

  async convertToExtractedPlaces(
    content: string,
    sourceArchive: string,
    sourceFilename: string,
  ): Promise<ExtractedPlace[]> {
    const createdAt = parseArchiveTimestamp(sourceArchive);
    const features = JSON.parse(content)?.features;
    const validFeatures = features.filter(this.validateFeature.bind(this));
    debugExtractedObjects(sourceFilename, features, validFeatures);
    return validFeatures.map(
      (feature: GeoJSONFeature): ExtractedPlace => ({
        cid: this.parseCid(feature.properties.google_maps_url),
        type: getPlaceType(sourceFilename),
        name: feature?.properties?.location?.name,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        sourceArchive: sourceArchive,
        sourceFile: sourceFilename,
        createdAt: createdAt,
      }),
    );
  }

  private validateFeature(feature: GeoJSONFeature): boolean {
    return feature?.properties?.google_maps_url?.includes(
      "://maps.google.com/?cid=",
    );
  }

  private parseCid(url: string): string {
    return url.split("=")[1];
  }
}

/** CSV files inside google takeout archive contain only name and URL */
class CsvConverter implements FileConverter {
  canHandle(fileName: string): boolean {
    return fileName.endsWith(".csv");
  }

  async convertToExtractedPlaces(
    content: string,
    sourceArchive: string,
    sourceFilename: string,
  ): Promise<ExtractedPlace[]> {
    const createdAt = parseArchiveTimestamp(sourceArchive);
    const rows = await this.parseCsvString(content);
    const validRows = rows.filter(this.validateRow.bind(this));
    debugExtractedObjects(sourceFilename, rows, validRows);
    return validRows.map(
      (row: CsvRow): ExtractedPlace => ({
        cid: this.parseCid(row.URL),
        type: getPlaceType(sourceFilename),
        name: row.Title,
        latitude: Number.NaN,
        longitude: Number.NaN,
        sourceArchive: sourceArchive,
        sourceFile: sourceFilename,
        createdAt: createdAt,
      }),
    );
  }

  /** Consumes the stream to return all rows at once */
  private async parseCsvString(content: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRow[] = [];
      csv
        .parseString<CsvRow, CsvRow>(content, { headers: true })
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", (err) => reject(err));
    });
  }

  private validateRow(row: CsvRow): boolean {
    return GOOGLE_MAPS_URL_HEX_REGEX.test(row.URL);
  }

  private parseCid(url: string): string {
    const match = url.match(GOOGLE_MAPS_URL_HEX_REGEX);
    if (!match) {
      // Should never happen because we validate the row before
      throw new Error(`${url}: invalid Google Maps URL`);
    }
    return BigInt(match[1]).toString();
  }
}

export async function extractPlacesFromArchive(
  sourceArchive: string,
  sourceFilename: string,
): Promise<ExtractedPlace[]> {
  // Available extractors
  const extractors: ArchiveExtractor[] = [new ZipExtractor()];

  // Available converters
  const converters: FileConverter[] = [new JsonConverter(), new CsvConverter()];

  // Find suitable extractor
  const extractor = extractors.find((e) => e.canHandle(sourceArchive));
  if (!extractor) {
    throw new Error(`${sourceArchive}: unsupported archive format`);
  }

  // Extract the file
  const fileContent = await extractor.extract(sourceArchive, sourceFilename);

  // Find suitable converter
  const converter = converters.find((c) => c.canHandle(sourceFilename));
  if (!converter) {
    throw new Error(`${sourceFilename}: unsupported file format`);
  }

  return await converter.convertToExtractedPlaces(
    fileContent,
    sourceArchive,
    sourceFilename,
  );
}
