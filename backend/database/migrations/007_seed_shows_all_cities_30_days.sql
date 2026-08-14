-- ============================================================
-- BookKaroo — Migration 007
-- Create venues, screens, and shows for ALL 25 cities
-- so that /movies page shows at least 1 show per city
-- for the next 30 days.
--
-- Shows Status: 0=Active | 1=Cancelled | 2=SoldOut
-- Run AFTER 006_seed_movies_all_languages_formats_genres.sql
-- ============================================================

DO $$
DECLARE
  -- City cursor
  c RECORD;

  -- Venue / Screen IDs
  v_id  uuid;
  s_id  uuid;

  -- Movie pool (all published movies, ordered by rating)
  all_movies uuid[];
  m_count    int;
  m_idx      int := 0;
  mid        uuid;

  -- Show generation
  d          int;
  show_d     date;
  city_lang  text;

  -- 3 show times: morning · afternoon · evening
  t_morning   constant time := '10:30'::time;
  t_afternoon constant time := '14:00'::time;
  t_evening   constant time := '19:00'::time;

BEGIN
  -- ── 1. Load published movies ──────────────────────────────────────────────
  SELECT ARRAY(
    SELECT "Id"
    FROM   "Movies"
    WHERE  "Status" = 1
      AND  "DeletedAt" IS NULL
      AND  "Category" = 0          -- NowShowing only
    ORDER  BY "ImdbRating" DESC NULLS LAST, "CreatedAt" DESC
    LIMIT  40
  ) INTO all_movies;

  m_count := COALESCE(array_length(all_movies, 1), 0);
  IF m_count = 0 THEN
    RAISE NOTICE 'No published NowShowing movies found — run 006 first.';
    RETURN;
  END IF;

  -- ── 2. Process each city ─────────────────────────────────────────────────
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

    -- ── 2a. Map state → primary screening language ────────────────────────
    city_lang := CASE c.scode
      WHEN '27' THEN 'Marathi'    -- Maharashtra  (Mumbai, Pune, Nagpur)
      WHEN '29' THEN 'Kannada'    -- Karnataka    (Bangalore, Mysore)
      WHEN '33' THEN 'Tamil'      -- Tamil Nadu   (Chennai, Coimbatore)
      WHEN '36' THEN 'Telugu'     -- Telangana    (Hyderabad)
      WHEN '37' THEN 'Telugu'     -- Andhra Pradesh (Visakhapatnam)
      WHEN '32' THEN 'Malayalam'  -- Kerala       (Kochi, Thiruvananthapuram)
      WHEN '19' THEN 'Bengali'    -- West Bengal  (Kolkata)
      WHEN '24' THEN 'Gujarati'   -- Gujarat      (Ahmedabad, Surat, Vadodara)
      WHEN '04' THEN 'Punjabi'    -- Chandigarh
      ELSE             'Hindi'    -- Delhi, Rajasthan, UP, MP, Bihar, Goa …
    END;

    -- ── 2b. Find or create venue ──────────────────────────────────────────
    SELECT "Id" INTO v_id
    FROM   "Venues"
    WHERE  "CityId"    = c.cid
      AND  "DeletedAt" IS NULL
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
        c.lat,  c.lng,
        '["Parking","Food Court","M-Ticket","Dolby","Recliner"]',
        true, now(), now(), NULL
      ) ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Created venue for %', c.cname;
    ELSE
      RAISE NOTICE 'Using existing venue for %', c.cname;
    END IF;

    -- ── 2c. Find or create screen ─────────────────────────────────────────
    SELECT "Id" INTO s_id
    FROM   "Screens"
    WHERE  "VenueId"   = v_id
      AND  "DeletedAt" IS NULL
    LIMIT  1;

    IF s_id IS NULL THEN
      s_id := gen_random_uuid();
      INSERT INTO "Screens" (
        "Id","VenueId","Name","Layout","TotalSeats",
        "IsActive","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        s_id, v_id, 'Screen 1',
        -- Standard 12-row × 18-col layout with 3 price tiers
        '{"rows":12,"cols":18,"aisleAfterCols":[5,11],"blockedSeats":[],'
        '"categories":['
          '{"name":"Recliner","rows":["A","B"],"price":500,"color":"#FFD700"},'
          '{"name":"Executive","rows":["C","D","E","F"],"price":320,"color":"#4169E1"},'
          '{"name":"Normal","rows":["G","H","I","J","K","L"],"price":200,"color":"#A1A1AA"}'
        ']}',
        216, -- 12 rows × 18 cols = 216 seats
        true, now(), now(), NULL
      ) ON CONFLICT DO NOTHING;
    END IF;

    -- ── 2d. Create shows for the next 30 days ────────────────────────────
    FOR d IN 0..29 LOOP
      show_d := CURRENT_DATE + d;

      -- Skip if this venue already has shows on this date
      -- (idempotent: re-running the script won't duplicate shows)
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM "Shows"
        WHERE  "VenueId"    = v_id
          AND  "ShowDate"   = show_d
          AND  "DeletedAt"  IS NULL
      );

      -- ── Morning show  10:30 ───────────────────────────────────────────
      m_idx := (m_idx % m_count) + 1;
      mid   := all_movies[m_idx];
      INSERT INTO "Shows" (
        "Id","ScreenId","VenueId","MovieId","EventId",
        "ShowDate","ShowTime","ShowDatetime",
        "Language","Format","PriceOverrides",
        "Status","CreatedAt","UpdatedAt","DeletedAt"
      ) VALUES (
        gen_random_uuid(), s_id, v_id, mid, NULL,
        show_d, t_morning,
        -- Convert IST (UTC+5:30) → UTC for storage
        (show_d::timestamp + t_morning) AT TIME ZONE 'Asia/Kolkata',
        city_lang, '2D', NULL,
        0, now(), now(), NULL
      );

      -- ── Afternoon show  14:00 ─────────────────────────────────────────
      m_idx := (m_idx % m_count) + 1;
      mid   := all_movies[m_idx];
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

      -- ── Evening show  19:00 ───────────────────────────────────────────
      m_idx := (m_idx % m_count) + 1;
      mid   := all_movies[m_idx];
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
  END LOOP; -- cities

  RAISE NOTICE 'Done. 3 shows × 30 days × every city inserted.';
END $$;


-- ============================================================
-- Verify — run these SELECTs individually after the DO block
-- ============================================================
/*

-- Shows per city for next 30 days
SELECT
  ci."Name"           AS city,
  COUNT(sh."Id")      AS total_shows,
  MIN(sh."ShowDate")  AS first_show,
  MAX(sh."ShowDate")  AS last_show
FROM  "Cities"  ci
JOIN  "Venues"  v  ON v."CityId"    = ci."Id"  AND v."DeletedAt"  IS NULL
JOIN  "Shows"   sh ON sh."VenueId"  = v."Id"   AND sh."DeletedAt" IS NULL
WHERE sh."ShowDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
GROUP BY ci."Name"
ORDER BY ci."Name";

-- Cities with NO shows in the next 30 days (should be empty after running)
SELECT ci."Name"
FROM  "Cities" ci
WHERE ci."IsActive" = true
  AND ci."DeletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM  "Venues"  v
    JOIN  "Shows"   sh ON sh."VenueId" = v."Id" AND sh."DeletedAt" IS NULL
    WHERE v."CityId"    = ci."Id"
      AND v."DeletedAt" IS NULL
      AND sh."ShowDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
  );

*/
