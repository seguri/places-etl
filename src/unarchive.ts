import { text } from "node:stream/consumers";
import * as csv from "@fast-csv/parse";
import yauzl from "yauzl-promise";

interface ArchiveExtractor {
  canHandle(archivePath: string): boolean;
  extract(archivePath: string, filename: string): Promise<string>;
}

/** Converts file content to GeoJSON */
interface FileConverter {
  canHandle(filename: string): boolean;
  convertToGeoJson(content: string): Promise<object>;
}

type CsvRow = {
  Title: string;
  Note: string;
  URL: string;
  Comment: string;
};

type CsvRowWithCid = CsvRow & {
  CID: string;
};

const convertToGeoJsonFeature = (
  name: string,
  cid: string,
  lat: number = Number.NaN,
  lng: number = Number.NaN,
) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lng, lat] },
  properties: {
    google_maps_url: `http://maps.google.com/?cid=${cid}`,
    location: {
      name: name,
    },
  },
});

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

  async convertToGeoJson(content: string): Promise<object> {
    return JSON.parse(content);
  }
}

/** CSV files inside google takeout archive contain only name and URL */
class CsvConverter implements FileConverter {
  canHandle(fileName: string): boolean {
    return fileName.endsWith(".csv");
  }

  async convertToGeoJson(content: string): Promise<object> {
    const rows = await this.parseCsvString(content);
    return {
      type: "FeatureCollection",
      features: rows.map((row) => convertToGeoJsonFeature(row.Title, row.CID)),
    };
  }

  /** Consumes the stream to return all rows at once */
  private async parseCsvString(content: string): Promise<CsvRowWithCid[]> {
    return new Promise((resolve, reject) => {
      const rows: CsvRowWithCid[] = [];
      csv
        .parseString<CsvRow, CsvRowWithCid>(content, { headers: true })
        .transform(this.addCid.bind(this))
        .on("data", (row) => rows.push(row))
        .on("end", () => resolve(rows))
        .on("error", (err) => reject(err));
    });
  }

  private addCid(row: CsvRow): CsvRowWithCid {
    return {
      ...row,
      CID: this.parseCid(row.URL),
    };
  }

  private parseCid(url: string): string {
    const match = url.match(/(?:0x[0-9a-f]+):(0x[0-9a-f]+)$/);
    if (!match) {
      throw new Error(`Invalid google_maps_url: ${url}`);
    }
    return BigInt(match[1]).toString();
  }
}

export async function readGeoJsonFromArchive(
  archiveFullPath: string,
  desiredFilename: string,
): Promise<object> {
  // Available extractors
  const extractors: ArchiveExtractor[] = [new ZipExtractor()];

  // Available converters
  const converters: FileConverter[] = [new JsonConverter(), new CsvConverter()];

  // Find suitable extractor
  const extractor = extractors.find((e) => e.canHandle(archiveFullPath));
  if (!extractor) {
    throw new Error(`${archiveFullPath}: unsupported archive format`);
  }

  // Extract the file
  const fileContent = await extractor.extract(archiveFullPath, desiredFilename);

  // Find suitable converter
  const converter = converters.find((c) => c.canHandle(desiredFilename));
  if (!converter) {
    throw new Error(`${desiredFilename}: unsupported file format`);
  }

  // Convert to GeoJSON
  return await converter.convertToGeoJson(fileContent);
}
