INSERT OR REPLACE INTO archives VALUES (1, 'takeout-20250325T224539Z-001.zip', '36332c56092b611817bca12e278a8cc539f103df62f1c62c331f372a2f5e5dda', 1742942739000);

INSERT OR REPLACE INTO scraped_coordinates VALUES ('9801820346085070797', 36.860213,  14.7598901); -- Bonajuto
INSERT OR REPLACE INTO scraped_coordinates VALUES ('16514378006705205331', 1.2, 3.4); -- Padellone

-- Frigerio: Saved with coordinates, Favourite without coordinates
-- Stranero: Saved with coordinates, Wishlist without coordinates
-- Bonajuto: Saved without coordinates, Wishlist without coordinates
-- Dicke: Saved without coordinates, Wishlist with coordinates (never happened before)
-- Padellone: Saved with coordinates, Wishlist without coordinates, scraped_coordinates should not overwrite
INSERT OR REPLACE INTO extracted_places VALUES('8856533912450397032',  'saved',     'Frigerio',                 45.4705773, 9.2267936,  1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('8856533912450397032',  'favourite', 'Pasticceria Frigerio',     NULL,       NULL,       1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('9280294067377638127',  'saved',     'Stranero',                 52.5521869, 13.363924,  1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('9280294067377638127',  'wishlist',  'Stranero',                 NULL,       NULL,       1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('9801820346085070797',  'saved',     'Antica Dolceria Bonajuto', NULL,       NULL,       1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('9801820346085070797',  'wishlist',  'Antica Dolceria Bonajuto', NULL,       NULL,       1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('9821492782070818882',  'saved',     'Dicke Wirtin',             NULL,       NULL,       1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('9821492782070818882',  'wishlist',  'Dicke Wirtin',             52.5065268, 13.3235691, 1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('16514378006705205331', 'saved',     'Al Padellone',             52.5065268, 13.3235691, 1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('16514378006705205331', 'wishlist',  'Al Padellone',             NULL,       NULL,       1742942739000, 1);
INSERT OR REPLACE INTO extracted_places VALUES('11111111111111111111', 'favourite', 'Peggiorato un pochino',    5.0,        9.0,        1000000000001, 1);
INSERT OR REPLACE INTO extracted_places VALUES('11111111111111111111', 'saved',     'Peggiorato un pochino',    4.0,        8.0,        1000000000002, 1);

