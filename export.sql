.headers on
.mode csv

.once ./out/favourites.csv
SELECT
  cid,
  latitude as lat,
  longitude as lon,
  name
FROM valid_places
WHERE type = 'favourite';

.once ./out/saved.csv
SELECT
  cid,
  latitude as lat,
  longitude as lon,
  name
FROM valid_places
WHERE type = 'saved';

.once ./out/wishlist.csv
SELECT
  cid,
  latitude as lat,
  longitude as lon,
  name
FROM valid_places
WHERE type = 'wishlist';
