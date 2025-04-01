export interface ExtractedPlace {
  cid: string;
  type: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  sourceArchive: string;
  sourceFile: string;
  createdAt: Date;
}
