-- ============================================================
-- BookKaroo — Migration 008
-- Fix: each city should show a DIFFERENT subset of movies.
--
-- Migration 007 rotated ALL movies through every city, so every
-- city ended up with all movies (defeating the city filter).
--
-- This migration:
--   1. Deletes shows that have no associated bookings (safe).
--   2. Re-creates shows where each city gets only movies that
--      match its primary regional language + a limited Hindi pool.
--
-- Result: selecting a different city on /movies shows a visibly
-- different movie list (Bangalore = Kannada + Hindi, Chennai = Tamil
-- + Hindi, Kolkata = Bengali + Hindi, etc.).
--
-- Run AFTER 007_seed_shows_all_cities_30_days.sql
-- ============================================================

-- ── Step 1: Delete shows that have no bookings (safe cleanup) ─────────────
DELETE FROM "Shows"
WHERE "Id" NOT IN (
  SELECT DISTINCT "ShowId"
  FROM   "Bookings"
  WHERE  "ShowId" IS NOT NULL
    AND  "DeletedAt" IS NULL
)
AND "DeletedAt" IS NULL;

-- ── Step 2: Re-create city-specific shows ─────────────────────────────────
DO $$
DECLARE
  c         RECORD;
  v_id      uuid;
  s_id      uuid;

  -- Language-based movie pools
  pool_regional  uuid[];   -- matches city primary language (up to 5)
  pool_hindi     uuid[];   -- top Hindi movies (up to 6)
  pool_english   uuid[];   -- top English movies (up to 3, for metro cities)
  city_pool      uuid[];   -- combined, deduplicated

  city_lang text;
  m_count   int;
  m_idx     int;
  mid       uuid;
  d         int;
  show_d    date;

  t_morning   constant time := '10:30'::time;
  t_afternoon constant time := '14:00'::time;
  t_evening   constant time := '19:00'::time;

BEGIN
  -- Pre-load Hindi pool once (used by every city)
  SELECT ARRAY(
    SELECT "Id" FROM "Movies"
    WHERE  "Status" = 1 AND "DeletedAt" IS NULL
      AND  'Hindi' = ANY("Languages")
      AND  "Category" = 0
    ORDER  BY "ImdbRating" DESC NULLS LAST
    LIMIT  6
  ) INTO pool_hindi;

  -- Pre-load English pool once
  SELECT ARRAY(
    SELECT "Id" FROM "Movies"
    WHERE  "Status" = 1 AND "DeletedAt" IS NULL
      AND  'English' = ANY("Languages")
      AND  "Category" = 0
    ORDER  BY "ImdbRating" DESC NULLS LAST
    LIMIT  3
  ) INTO pool_english;

  FOR c IN
    SELECT
      "Id"        AS cid,
      "Name"      AS cname,
      "Slug"      AS cslug,
      "StateCode" AS scode,
      "Latitude"  AS lat,
      "Longitude" AS lng
    FROM  "Cities"
    WHERE "IsActive"  = true
      AND "DeletedAt" IS NULL
    ORDER BY "Name"
  LOOP

    -- ── Map state → primary language ────────────────────────────────────
    city_lang := CASE c.scode
      WHEN '27' THEN 'Marathi'
      WHEN '29' THEN 'Kannada'
      WHEN '33' THEN 'Tamil'
      WHEN '36' THEN 'Telugu'
      WHEN '37' THEN 'Telugu'
      WHEN '32' THEN 'Malayalam'
      WHEN '19' THEN 'Bengali'
      WHEN '24' THEN 'Gujarati'
      WHEN '04' THEN 'Punjabi'
      ELSE             'Hindi'
    END;

    -- ── Build regional-language movie pool (max 5 movies) ───────────────
    SELECT ARRAY(
      SELECT "Id" FROM "Movies"
      WHERE  "Status" = 1 AND "DeletedAt" IS NULL
        AND  city_lang = ANY("Languages")
        AND  "Category" = 0
      ORDER  BY "ImdbRating" DESC NULLS LAST
      LIMIT  5
    ) INTO pool_regional;

    -- ── Combine: regional + Hindi (+ English for major metros) ──────────
    -- Remove duplicates by unioning and re-selecting
    IF c.scode IN ('07','27','29','33','19') THEN
      -- Metro cities: regional + Hindi + 2 English for variety
      SELECT ARRAY(
        SELECT DISTINCT unnest(pool_regional || pool_hindi || pool_english[1:2])
        LIMIT 10
      ) INTO city_pool;
    ELSE
      -- Other cities: regional + Hindi only
      SELECT ARRAY(
        SELECT DISTINCT unnest(pool_regional || pool_hindi)
        LIMIT 8
      ) INTO city_pool;
    END IF;

    m_count := COALESCE(array_length(city_pool, 1), 0);
    IF m_count = 0 THEN
      RAISE NOTICE 'No movies for city % — skipping.', c.cname;
      CONTINUE;
    END IF;

    -- ── Find or create venue ────────────────────────────────────────────
    SELECT "Id" INTO v_id
    FROM   "Venues"
    WHERE  "CityId" = c.cid AND "DeletedAt" IS NULL
    LIMIT  1;

    IF v_id IS NULL THEN
      v_id := gen_random_uuid();
      INSERT INTO "Venues" (
        "Id","Name","Slug","Chain","Address",
        "CityId","StateCode","Latitude","Longitude",
        "Amenities","IsActive","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        v_id,
        'PVR Cinemas · ' || c.cname,
        'pvr-cinemas-'   || c.cslug,
        'PVR',
        'City Centre Mall, ' || c.cname,
        c.cid, c.scode,
        c.lat, c.lng,
        '["Parking","Food Court","M-Ticket","Dolby","Recliner"]',
        true, now(), now(), NULL
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- ── Find or create screen ────────────────────────────────────────────
    SELECT "Id" INTO s_id
    FROM   "Screens"
    WHERE  "VenueId" = v_id AND "DeletedAt" IS NULL
    LIMIT  1;

    IF s_id IS NULL THEN
      s_id := gen_random_uuid();
      INSERT INTO "Screens" (
        "Id","VenueId","Name","Layout","TotalSeats",
        "IsActive","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        s_id, v_id, 'Screen 1',
        '{"rows":12,"cols":18,"aisleAfterCols":[5,11],"blockedSeats":[],'
        '"categories":['
          '{"name":"Recliner","rows":["A","B"],"price":500,"color":"#FFD700"},'
          '{"name":"Executive","rows":["C","D","E","F"],"price":320,"color":"#4169E1"},'
          '{"name":"Normal","rows":["G","H","I","J","K","L"],"price":200,"color":"#A1A1AA"}'
        ']}',
        216, true, now(), now(), NULL
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- ── Create 30 days of shows, cycling through city_pool only ──────────
    m_idx := 0; -- reset per city so every city starts with its top movie

    FOR d IN 0..29 LOOP
      show_d := CURRENT_DATE + d;

      -- Idempotent: skip if venue already has shows on this day
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM "Shows"
        WHERE "VenueId"   = v_id
          AND "ShowDate"  = show_d
          AND "DeletedAt" IS NULL
      );

      -- Morning — city primary language, 2D
      m_idx := (m_idx % m_count) + 1;
      mid   := city_pool[m_idx];
      INSERT INTO "Shows" (
        "Id","ScreenId","VenueId","MovieId","EventId",
        "ShowDate","ShowTime","ShowDatetime",
        "Language","Format","PriceOverrides",
        "Status","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        gen_random_uuid(), s_id, v_id, mid, NULL,
        show_d, t_morning,
        (show_d::timestamp + t_morning) AT TIME ZONE 'Asia/Kolkata',
        city_lang, '2D', NULL,
        0, now(), now(), NULL
      );

      -- Afternoon — Hindi, 2D
      m_idx := (m_idx % m_count) + 1;
      mid   := city_pool[m_idx];
      INSERT INTO "Shows" (
        "Id","ScreenId","VenueId","MovieId","EventId",
        "ShowDate","ShowTime","ShowDatetime",
        "Language","Format","PriceOverrides",
        "Status","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        gen_random_uuid(), s_id, v_id, mid, NULL,
        show_d, t_afternoon,
        (show_d::timestamp + t_afternoon) AT TIME ZONE 'Asia/Kolkata',
        'Hindi', '2D', NULL,
        0, now(), now(), NULL
      );

      -- Evening — Hindi, IMAX
      m_idx := (m_idx % m_count) + 1;
      mid   := city_pool[m_idx];
      INSERT INTO "Shows" (
        "Id","ScreenId","VenueId","MovieId","EventId",
        "ShowDate","ShowTime","ShowDatetime",
        "Language","Format","PriceOverrides",
        "Status","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        gen_random_uuid(), s_id, v_id, mid, NULL,
        show_d, t_evening,
        (show_d::timestamp + t_evening) AT TIME ZONE 'Asia/Kolkata',
        'Hindi', 'IMAX', NULL,
        0, now(), now(), NULL
      );

    END LOOP; -- days

    RAISE NOTICE 'City % → % movies × 30 days', c.cname, m_count;
  END LOOP; -- cities

  RAISE NOTICE 'Done. Each city now shows only its language-relevant movies.';
END $$;


-- ============================================================
-- Verify: each city should show DIFFERENT movies
-- Run these after the DO block to confirm
-- ============================================================
/*

-- Movie count per city (should be 6–10 per city, not 26)
SELECT
  ci."Name"               AS city,
  COUNT(DISTINCT sh."MovieId") AS distinct_movies
FROM  "Cities"  ci
JOIN  "Venues"  v  ON v."CityId"   = ci."Id"  AND v."DeletedAt" IS NULL
JOIN  "Shows"   sh ON sh."VenueId" = v."Id"   AND sh."DeletedAt" IS NULL
WHERE sh."ShowDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
GROUP BY ci."Name"
ORDER BY ci."Name";

-- Sample: what movies are showing in Chennai vs Mumbai?
SELECT 'Chennai' AS city, m."Title", sh."Language"
FROM "Cities" ci
JOIN "Venues" v ON v."CityId" = ci."Id"
JOIN "Shows" sh ON sh."VenueId" = v."Id" AND sh."DeletedAt" IS NULL
JOIN "Movies" m ON m."Id" = sh."MovieId"
WHERE ci."Name" = 'Chennai'
  AND sh."ShowDate" = CURRENT_DATE
GROUP BY m."Title", sh."Language"
UNION ALL
SELECT 'Mumbai' AS city, m."Title", sh."Language"
FROM "Cities" ci
JOIN "Venues" v ON v."CityId" = ci."Id"
JOIN "Shows" sh ON sh."VenueId" = v."Id" AND sh."DeletedAt" IS NULL
JOIN "Movies" m ON m."Id" = sh."MovieId"
WHERE ci."Name" = 'Mumbai'
  AND sh."ShowDate" = CURRENT_DATE
GROUP BY m."Title", sh."Language"
ORDER BY city, "Title";

*/
