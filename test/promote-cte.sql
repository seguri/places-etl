WITH ranked_places AS (
  SELECT
    ep.*,
    -- Rank places by creation date and type priority
    ROW_NUMBER() OVER (
      PARTITION BY ep.cid
      ORDER BY
        ep.created_at DESC,
        CASE ep.type
          WHEN 'favourite' THEN 1
          WHEN 'saved' THEN 2
          ELSE 3
        END
    ) AS type_rank,
    ROW_NUMBER() OVER (
      PARTITION BY ep.cid
      ORDER BY
        CASE
          WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 0
          ELSE 1
        END,
        ep.created_at DESC
    ) AS coordinates_rank
  FROM extracted_places ep
)
INSERT OR REPLACE INTO valid_places (
  cid,
  type,
  name,
  latitude,
  longitude
)
-- Two choices:
-- 1. (current) SELECT potentially null coordinates and let the INSERT fail
-- 2. Move this SELECT into a `best_places AS (...)` and then SELECT from that where coordinates are not null
SELECT
  best_type.cid,
  best_type.type,
  best_type.name,
  COALESCE(best_coords.latitude, sc.latitude) AS latitude,
  COALESCE(best_coords.longitude, sc.longitude) AS longitude
FROM
  (SELECT * FROM ranked_places WHERE type_rank = 1) best_type
LEFT JOIN
  (SELECT * FROM ranked_places WHERE coordinates_rank = 1) best_coords
  ON best_type.cid = best_coords.cid
LEFT JOIN
  scraped_coordinates sc
  ON best_type.cid = sc.cid;

SELECT *
FROM valid_places
ORDER BY name;
