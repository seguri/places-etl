import { text } from "node:stream/consumers";
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

class CsvConverter implements FileConverter {
  canHandle(fileName: string): boolean {
    return fileName.endsWith(".csv");
  }

  async convertToGeoJson(content: string): Promise<object> {
    // TODO: Implement CSV to GeoJSON conversion
    return {};
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
