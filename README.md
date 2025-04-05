# places-etl

## Manual adjustments

Valid CID and no coordinates: retrieve them from `https://maps.google.com/?cid=${cid}` and manually insert them in `scraped_coordinates`:

```
INSERT INTO scraped_coordinates (cid, latitude, longitude) VALUES ('1', 2, 3);
```

Invalid CID with a name: try to find the place on Google Maps and manually insert it in `valid_places`.

```
INSERT INTO valid_places (cid, type, name, latitude, longitude, created_at) VALUES ('2082533386314007970', 'wishlist', "Joe's Shanghai", 40.71582823972191, -73.9966827067003, CURRENT_TIMESTAMP);
```

## How to manage places that change list?

