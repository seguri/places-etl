# places-etl

## How to use

1. Download your Google Maps data from https://takeout.google.com/settings
2. Update the zip filename in `elt.ts`
3. Run `npm run elt`
4. Run `sqlite3.exe .\places.db ".read export.sql"`
5. Import the CSV files in Supabase (Select Project > Table Editor > Select Table > Insert button > Import CSV)

## Manual adjustments

In the past, I've automatised the scraping of coordinates to populate the current ~1.6k records in `scraped_coordinates`.
As of today, this is no longer necessary, and I prefer to keep this table untouched from automations.

Valid CID and no coordinates: retrieve them from `https://maps.google.com/?cid=${cid}` and manually insert them in `scraped_coordinates`:

```
INSERT INTO scraped_coordinates (cid, latitude, longitude) VALUES ('cid', 1.2, -3.4);
```

Invalid CID with a name: try to find the place on Google Maps and manually insert it in `valid_places`.
To make it survive the next ELT run, insert its coordinates in `scraped_coordinates` too (see above).

```
INSERT INTO valid_places (cid, type, name, latitude, longitude, created_at) VALUES ('2082533386314007970', 'wishlist', "Joe's Shanghai", 40.71582823972191, -73.9966827067003, CURRENT_TIMESTAMP);
```

## How to manage places that get updated or change list?

I've enabled loading the same place multiple times from different archives.
The process of promoting extracting places to valid places will consider only the most recent type available, in this priority order: favourite, wishlist, saved.

## Hom I'm using Google Maps

Saved Places are stored in a special JSON file, where Google also stores the coordinates.
So I'm now saving all places both as Saved Places, and then as Favourite places or Want to go places (if that's the case).
This should remove the need to ever scrape coordinates again.

## SQLite transactions

I've tested transactions in `database.ts` with the `testTransaction` method:

```typescript
testTransaction(): void {
  this.doInTransaction(() => {
    this.exec("INSERT INTO test (text) VALUES ('transaction-test');");
    this.exec("THIS IS INVALID SQL");
    this.exec("INSERT INTO test (text) VALUES ('should-not-exist');");
  });
}
```

And there was no record in table `test` after running the test.
