export interface Archive {
  id: number;
  path: string;
  hash: string;
  createdAt: Date;
}

export interface ExtractedPlace {
  cid: string;
  type: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  archiveId: number;
}

export interface ValidPlace {
  cid: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

/** As the debug logs show in my case, there are very few places without a name.
 * I have instead a lot of places without coordinates, so I'll scrape just the coordinates from the web.
 * In GIS and mapping contexts, this is often referred to as `LatLng`.
 */
export interface ScrapedCoordinate {
  cid: string;
  latitude: number;
  longitude: number;
}
