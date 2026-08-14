-- Migration 012: Seed Exclusive + Premiere movies with shows for Ahmedabad
-- Category: 0=NowShowing  1=ComingSoon  2=Exclusive  3=Premiere
-- Status:   0=Draft        1=Published   2=Archived
-- Run in Supabase SQL Editor

-- ── 1. Insert Exclusive movies ─────────────────────────────────────────────────
INSERT INTO "Movies" ("Id","TmdbId","Title","Slug","Description","DurationMin","Languages","Formats","Genres","Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl","ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt") VALUES

  (gen_random_uuid(), NULL,
   'The Sabarmati Report', 'the-sabarmati-report',
   'An exclusive BookKaroo screening of the hard-hitting investigative drama based on the 2002 Godhra train burning incident and its aftermath.',
   136, ARRAY['Hindi'], ARRAY['2D','Dolby'], ARRAY['Drama','Thriller'],
   'UA', '2026-05-20',
   '/4mHomO2xHOZIVjuAX7T1zs0vhVY.jpg', '/yCfYLKdGn6GHFBJmYSELMb5r7Cp.jpg',
   NULL, 8.1, 1, 2, now(), now(), NULL),

  (gen_random_uuid(), NULL,
   'Mahavatar — IMAX Exclusive', 'mahavatar-imax-exclusive',
   'An epic mythological retelling of the divine Avatars of Lord Vishnu — available exclusively in IMAX at select BookKaroo partner cinemas.',
   158, ARRAY['Hindi','Sanskrit'], ARRAY['IMAX','4DX'], ARRAY['Mythology','Drama','Action'],
   'U', '2026-05-25',
   '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', '/kGz1VTHXV3rS0GaM0mxdZMFMIqL.jpg',
   NULL, 8.5, 1, 2, now(), now(), NULL),

  (gen_random_uuid(), NULL,
   'Dune: Messiah', 'dune-messiah',
   'The definitive conclusion to the Atreides saga — streaming exclusively in theatres before any OTT release.',
   162, ARRAY['English','Hindi'], ARRAY['IMAX','Dolby'], ARRAY['Sci-Fi','Action','Drama'],
   'UA', '2026-06-01',
   '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', '/gRApXuxWmO2O1yqwlWOSjBHGq8Y.jpg',
   NULL, 8.7, 1, 2, now(), now(), NULL)

ON CONFLICT DO NOTHING;

-- ── 2. Insert Premiere movies ──────────────────────────────────────────────────
INSERT INTO "Movies" ("Id","TmdbId","Title","Slug","Description","DurationMin","Languages","Formats","Genres","Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl","ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt") VALUES

  (gen_random_uuid(), NULL,
   'Ramayana: Part 1 — Premiere', 'ramayana-part-1-premiere',
   'Grand world premiere of Nitesh Tiwari''s epic retelling of the Ramayana. Join the premiere night and be the first to witness Ranbir Kapoor as Ram.',
   165, ARRAY['Hindi'], ARRAY['IMAX','4DX','Dolby'], ARRAY['Mythology','Action','Drama'],
   'U', '2026-06-05',
   '/cGXFosYUHYjjdKZMCXsebYMtJH8.jpg', '/8RPpDf3VCmTWI4KpiB2kBPCvMFN.jpg',
   NULL, 9.2, 1, 3, now(), now(), NULL),

  (gen_random_uuid(), NULL,
   'Singham Returns — Grand Premiere', 'singham-returns-grand-premiere',
   'Special premiere night for Cop Universe fans. Bajirao Singham returns to face his biggest nemesis yet in Rohit Shetty''s blockbuster franchise.',
   148, ARRAY['Hindi'], ARRAY['2D','IMAX'], ARRAY['Action','Crime'],
   'UA', '2026-06-10',
   '/oaHPEeC0v5XWmRH0zOmqFVJYTXi.jpg', '/a4jbFnWJeXD2KhMCsRpX6V3PKQR.jpg',
   NULL, 7.9, 1, 3, now(), now(), NULL),

  (gen_random_uuid(), NULL,
   'Metro In Dino — Premiere Night', 'metro-in-dino-premiere',
   'Anurag Basu''s heartwarming anthology of love stories set in modern Mumbai — premiere night experience with director Q&A.',
   145, ARRAY['Hindi'], ARRAY['2D','Dolby'], ARRAY['Romance','Drama'],
   'UA', '2026-06-12',
   '/p3GT8Cz5AKkFo0UrMPhBVgypQQ8.jpg', '/3n5UQ7X3JH7jEI0RFh9O7cqwMdi.jpg',
   NULL, 8.0, 1, 3, now(), now(), NULL)

ON CONFLICT DO NOTHING;

-- ── 3. Create shows for Exclusive + Premiere movies in Ahmedabad ───────────────
DO $$
DECLARE
  screen1  uuid;
  screen2  uuid;
  screen3  uuid;
  venue1   uuid;
  venue2   uuid;
  venue3   uuid;
  m_excl1  uuid;
  m_excl2  uuid;
  m_excl3  uuid;
  m_prem1  uuid;
  m_prem2  uuid;
  m_prem3  uuid;
  today    date := current_date;
BEGIN
  -- Resolve Ahmedabad screens
  SELECT s."Id", s."VenueId" INTO screen1, venue1
    FROM "Screens" s JOIN "Venues" v ON s."VenueId"=v."Id"
    WHERE v."Slug"='pvr-acropolis-ahmedabad' LIMIT 1;

  SELECT s."Id", s."VenueId" INTO screen2, venue2
    FROM "Screens" s JOIN "Venues" v ON s."VenueId"=v."Id"
    WHERE v."Slug"='inox-iscon-ahmedabad' LIMIT 1;

  SELECT s."Id", s."VenueId" INTO screen3, venue3
    FROM "Screens" s JOIN "Venues" v ON s."VenueId"=v."Id"
    WHERE v."Slug"='cinepolis-pavilion-ahmedabad' LIMIT 1;

  -- Resolve movie IDs
  SELECT "Id" INTO m_excl1 FROM "Movies" WHERE "Slug"='the-sabarmati-report'  LIMIT 1;
  SELECT "Id" INTO m_excl2 FROM "Movies" WHERE "Slug"='mahavatar-imax-exclusive' LIMIT 1;
  SELECT "Id" INTO m_excl3 FROM "Movies" WHERE "Slug"='dune-messiah'          LIMIT 1;
  SELECT "Id" INTO m_prem1 FROM "Movies" WHERE "Slug"='ramayana-part-1-premiere' LIMIT 1;
  SELECT "Id" INTO m_prem2 FROM "Movies" WHERE "Slug"='singham-returns-grand-premiere' LIMIT 1;
  SELECT "Id" INTO m_prem3 FROM "Movies" WHERE "Slug"='metro-in-dino-premiere' LIMIT 1;

  -- Shows for next 7 days
  FOR i IN 0..6 LOOP

    -- Exclusive 1: The Sabarmati Report — PVR, 11AM + 3:30PM + 8PM
    INSERT INTO "Shows" ("Id","ScreenId","VenueId","MovieId","EventId","ShowDate","ShowTime","ShowDatetime","Format","Language","PriceOverrides","Status","CreatedAt","UpdatedAt","DeletedAt")
    VALUES
      (gen_random_uuid(),screen1,venue1,m_excl1,NULL, today+i,'11:00:00',(today+i)::timestamp+'11:00:00'::time,'Dolby','Hindi','{"recliner":700,"executive":450,"normal":280}',0,now(),now(),NULL),
      (gen_random_uuid(),screen1,venue1,m_excl1,NULL, today+i,'15:30:00',(today+i)::timestamp+'15:30:00'::time,'Dolby','Hindi','{"recliner":700,"executive":450,"normal":280}',0,now(),now(),NULL),
      (gen_random_uuid(),screen1,venue1,m_excl1,NULL, today+i,'20:00:00',(today+i)::timestamp+'20:00:00'::time,'Dolby','Hindi','{"recliner":700,"executive":450,"normal":280}',0,now(),now(),NULL),

    -- Exclusive 2: Mahavatar IMAX — INOX, 10:30AM + 7PM
      (gen_random_uuid(),screen2,venue2,m_excl2,NULL, today+i,'10:30:00',(today+i)::timestamp+'10:30:00'::time,'IMAX','Hindi','{"recliner":800,"executive":550,"normal":350}',0,now(),now(),NULL),
      (gen_random_uuid(),screen2,venue2,m_excl2,NULL, today+i,'19:00:00',(today+i)::timestamp+'19:00:00'::time,'IMAX','Hindi','{"recliner":800,"executive":550,"normal":350}',0,now(),now(),NULL),

    -- Exclusive 3: Dune Messiah — Cinépolis, 12PM + 4PM + 9PM
      (gen_random_uuid(),screen3,venue3,m_excl3,NULL, today+i,'12:00:00',(today+i)::timestamp+'12:00:00'::time,'Dolby','English','{"recliner":750,"executive":500,"normal":320}',0,now(),now(),NULL),
      (gen_random_uuid(),screen3,venue3,m_excl3,NULL, today+i,'16:00:00',(today+i)::timestamp+'16:00:00'::time,'Dolby','English','{"recliner":750,"executive":500,"normal":320}',0,now(),now(),NULL),
      (gen_random_uuid(),screen3,venue3,m_excl3,NULL, today+i,'21:00:00',(today+i)::timestamp+'21:00:00'::time,'Dolby','English','{"recliner":750,"executive":500,"normal":320}',0,now(),now(),NULL),

    -- Premiere 1: Ramayana Part 1 — PVR, 6PM + 9:30PM
      (gen_random_uuid(),screen1,venue1,m_prem1,NULL, today+i,'18:00:00',(today+i)::timestamp+'18:00:00'::time,'IMAX','Hindi','{"recliner":1200,"executive":800,"normal":500}',0,now(),now(),NULL),
      (gen_random_uuid(),screen1,venue1,m_prem1,NULL, today+i,'21:30:00',(today+i)::timestamp+'21:30:00'::time,'IMAX','Hindi','{"recliner":1200,"executive":800,"normal":500}',0,now(),now(),NULL),

    -- Premiere 2: Singham Returns — INOX, 3PM + 7:30PM
      (gen_random_uuid(),screen2,venue2,m_prem2,NULL, today+i,'15:00:00',(today+i)::timestamp+'15:00:00'::time,'2D','Hindi','{"recliner":900,"executive":600,"normal":400}',0,now(),now(),NULL),
      (gen_random_uuid(),screen2,venue2,m_prem2,NULL, today+i,'19:30:00',(today+i)::timestamp+'19:30:00'::time,'2D','Hindi','{"recliner":900,"executive":600,"normal":400}',0,now(),now(),NULL),

    -- Premiere 3: Metro In Dino — Cinépolis, 5PM + 8:30PM
      (gen_random_uuid(),screen3,venue3,m_prem3,NULL, today+i,'17:00:00',(today+i)::timestamp+'17:00:00'::time,'Dolby','Hindi','{"recliner":850,"executive":550,"normal":350}',0,now(),now(),NULL),
      (gen_random_uuid(),screen3,venue3,m_prem3,NULL, today+i,'20:30:00',(today+i)::timestamp+'20:30:00'::time,'Dolby','Hindi','{"recliner":850,"executive":550,"normal":350}',0,now(),now(),NULL)

    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Verify
SELECT m."Title", m."Category", COUNT(s."Id") as show_count
FROM "Movies" m
LEFT JOIN "Shows" s ON s."MovieId" = m."Id"
WHERE m."Category" IN (1, 2, 3)
GROUP BY m."Title", m."Category"
ORDER BY m."Category", m."Title";
