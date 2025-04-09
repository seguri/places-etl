# places-etl

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

## How to manage places that change list?

I've enabled loading the same place multiple times from different archives.
The process of promoting extracting places to valid places will consider only the most recent type available, in this priority order: favourite, saved, wishlist.

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