-- ============================================================
-- BookKaroo — Seed Data
-- Run this AFTER 001_initial_schema.sql
-- Execute in Supabase → SQL Editor
-- ============================================================

-- ── Settings (company details, GST rates, fee config) ──────
INSERT INTO "Settings" ("Key", "Value", "UpdatedAt") VALUES
  ('company_name',              '"BookKaroo Pvt Ltd"',            now()),
  ('company_legal_name',        '"BookKaroo Private Limited"',    now()),
  ('company_gstin',             '"24XXXXX0000X1Z5"',              now()),
  ('company_pan',               '"XXXXX0000X"',                   now()),
  ('company_state_code',        '"24"',                           now()),
  ('company_state_name',        '"Gujarat"',                      now()),
  ('company_address_line1',     '"701, Demo Tower, SG Highway"',  now()),
  ('company_address_line2',     '"Bodakdev"',                     now()),
  ('company_city',              '"Ahmedabad"',                    now()),
  ('company_pincode',           '"380054"',                       now()),
  ('company_country',           '"India"',                        now()),
  ('company_phone',             '"+91 79 0000 0000"',             now()),
  ('company_email',             '"support@bookkaroo.com"',        now()),
  ('convenience_fee_per_ticket','59.00',                          now()),
  ('offer_processing_fee',      '15.00',                          now()),
  ('gst_rate',                  '0.18',                           now()),
  ('cgst_rate_intra',           '0.09',                           now()),
  ('sgst_rate_intra',           '0.09',                           now()),
  ('igst_rate_inter',           '0.18',                           now()),
  ('sac_code_convenience',      '"998554"',                       now()),
  ('sac_code_offer',            '"997159"',                       now()),
  ('sac_code_other',            '"999799"',                       now()),
  ('cancellation_window_hours', '2',                              now()),
  ('refund_processing_days',    '7',                              now()),
  ('payment_provider',          '"mock"',                         now()),
  ('max_seats_per_booking',     '10',                             now()),
  ('seat_lock_minutes',         '8',                              now()),
  ('support_email',             '"support@bookkaroo.com"',        now()),
  ('support_url',               '"https://bookkaroo.com/help"',   now()),
  ('cancellation_policy',       '"Convenience fee is non-refundable. Full refund on ticket amount if cancelled 2+ hours before show."', now())
ON CONFLICT ("Key") DO UPDATE SET "Value" = EXCLUDED."Value", "UpdatedAt" = now();

-- ── Cities (25 seed cities) ────────────────────────────────
INSERT INTO "Cities" ("Id","Name","Slug","State","StateCode","Country","Latitude","Longitude","IsActive","CreatedAt","UpdatedAt","DeletedAt") VALUES
  (gen_random_uuid(),'Mumbai',           'mumbai',           'Maharashtra',     '27','India',19.0760, 72.8777,true,now(),now(),NULL),
  (gen_random_uuid(),'Delhi-NCR',        'delhi-ncr',        'Delhi',           '07','India',28.6139, 77.2090,true,now(),now(),NULL),
  (gen_random_uuid(),'Bangalore',        'bangalore',        'Karnataka',       '29','India',12.9716, 77.5946,true,now(),now(),NULL),
  (gen_random_uuid(),'Hyderabad',        'hyderabad',        'Telangana',       '36','India',17.3850, 78.4867,true,now(),now(),NULL),
  (gen_random_uuid(),'Ahmedabad',        'ahmedabad',        'Gujarat',         '24','India',23.0225, 72.5714,true,now(),now(),NULL),
  (gen_random_uuid(),'Chennai',          'chennai',          'Tamil Nadu',      '33','India',13.0827, 80.2707,true,now(),now(),NULL),
  (gen_random_uuid(),'Pune',             'pune',             'Maharashtra',     '27','India',18.5204, 73.8567,true,now(),now(),NULL),
  (gen_random_uuid(),'Kolkata',          'kolkata',          'West Bengal',     '19','India',22.5726, 88.3639,true,now(),now(),NULL),
  (gen_random_uuid(),'Jaipur',           'jaipur',           'Rajasthan',       '08','India',26.9124, 75.7873,true,now(),now(),NULL),
  (gen_random_uuid(),'Lucknow',          'lucknow',          'Uttar Pradesh',   '09','India',26.8467, 80.9462,true,now(),now(),NULL),
  (gen_random_uuid(),'Chandigarh',       'chandigarh',       'Chandigarh',      '04','India',30.7333, 76.7794,true,now(),now(),NULL),
  (gen_random_uuid(),'Kochi',            'kochi',            'Kerala',          '32','India', 9.9312, 76.2673,true,now(),now(),NULL),
  (gen_random_uuid(),'Goa',              'goa',              'Goa',             '30','India',15.2993, 74.1240,true,now(),now(),NULL),
  (gen_random_uuid(),'Indore',           'indore',           'Madhya Pradesh',  '23','India',22.7196, 75.8577,true,now(),now(),NULL),
  (gen_random_uuid(),'Bhopal',           'bhopal',           'Madhya Pradesh',  '23','India',23.2599, 77.4126,true,now(),now(),NULL),
  (gen_random_uuid(),'Nagpur',           'nagpur',           'Maharashtra',     '27','India',21.1458, 79.0882,true,now(),now(),NULL),
  (gen_random_uuid(),'Surat',            'surat',            'Gujarat',         '24','India',21.1702, 72.8311,true,now(),now(),NULL),
  (gen_random_uuid(),'Vadodara',         'vadodara',         'Gujarat',         '24','India',22.3072, 73.1812,true,now(),now(),NULL),
  (gen_random_uuid(),'Coimbatore',       'coimbatore',       'Tamil Nadu',      '33','India',11.0168, 76.9558,true,now(),now(),NULL),
  (gen_random_uuid(),'Mysore',           'mysore',           'Karnataka',       '29','India',12.2958, 76.6394,true,now(),now(),NULL),
  (gen_random_uuid(),'Visakhapatnam',    'visakhapatnam',    'Andhra Pradesh',  '37','India',17.6868, 83.2185,true,now(),now(),NULL),
  (gen_random_uuid(),'Bhubaneswar',      'bhubaneswar',      'Odisha',          '21','India',20.2961, 85.8245,true,now(),now(),NULL),
  (gen_random_uuid(),'Guwahati',         'guwahati',         'Assam',           '18','India',26.1445, 91.7362,true,now(),now(),NULL),
  (gen_random_uuid(),'Patna',            'patna',            'Bihar',           '10','India',25.5941, 85.1376,true,now(),now(),NULL),
  (gen_random_uuid(),'Thiruvananthapuram','thiruvananthapuram','Kerala',         '32','India', 8.5241, 76.9366,true,now(),now(),NULL)
ON CONFLICT DO NOTHING;

-- ── Movies (8 popular Bollywood/South Indian films) ────────
INSERT INTO "Movies" ("Id","TmdbId","Title","Slug","Description","DurationMin","Languages","Formats","Genres","Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl","ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt") VALUES
  (gen_random_uuid(), 819740,
   'KGF: Chapter 2', 'kgf-chapter-2',
   'Rocky''s bloodsoaked rise to power continues. Now the most feared man in the gold mines of Kolar, he faces a new threat from within the political establishment — and from a ghost of his own past.',
   168, ARRAY['Kannada','Hindi','Tamil','Telugu'], ARRAY['2D','IMAX','4DX'], ARRAY['Action','Drama'],
   'A', '2022-04-14',
   '/k3No9gKfMVUbv52fYL5gbSlsXbk.jpg', '/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
   'https://www.youtube.com/watch?v=4D37DEhUOcQ', 8.4, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 1232252,
   'Chhaava', 'chhaava',
   'The legend of Chhatrapati Sambhaji Maharaj — warrior, poet, king. A man who chose death over dishonour and left an empire changed forever.',
   162, ARRAY['Hindi','Marathi'], ARRAY['2D','IMAX','Dolby'], ARRAY['Historical','Action','Drama'],
   'UA', '2025-02-14',
   '/6Wps7AYJG6AKYxXfQ6R0kxYDNxk.jpg', '/8gHn0EpHqd27EIyBXsVRAFcAaAX.jpg',
   NULL, 9.1, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 1240163,
   'Pushpa 2: The Rule', 'pushpa-2-the-rule',
   'Pushpa Raj has built a red sandalwood empire no one can touch. But Shekhawat is back — and this time, it''s personal. The Rule begins.',
   202, ARRAY['Telugu','Hindi','Tamil'], ARRAY['2D','IMAX','4DX','Dolby'], ARRAY['Action','Thriller'],
   'UA', '2024-12-05',
   '/jVkpuAaTwHVQPl5CyEJoT9FdP9J.jpg', '/4mcO7oAWMiI2VrEy72wBRgfXLiL.jpg',
   NULL, 8.6, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 759544,
   'RRR', 'rrr',
   'Two legendary Indian revolutionaries — Alluri Sitarama Raju and Komaram Bheem — fight back against the British Raj. Before they became legends, they met.',
   182, ARRAY['Telugu','Hindi','Tamil'], ARRAY['2D','4K','IMAX'], ARRAY['Action','Drama','Historical'],
   'UA', '2022-03-25',
   '/nEufeZa15NfBmk3iXjHqWCeGM3B.jpg', '/8RPpDf3VCmTWI4KpiB2kBPCvMFN.jpg',
   NULL, 8.8, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 1160079,
   'Stree 2', 'stree-2',
   'Chanderi is safe — or so they thought. Stree returns with a new threat, and the gang must face a force far more terrifying than before.',
   140, ARRAY['Hindi'], ARRAY['2D','Dolby'], ARRAY['Horror','Comedy'],
   'UA', '2024-08-15',
   '/p3GT8Cz5AKkFo0UrMPhBVgypQQ8.jpg', '/3n5UQ7X3JH7jEI0RFh9O7cqwMdi.jpg',
   NULL, 8.3, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 1014590,
   'Animal', 'animal',
   'A son''s obsessive love for his father drives him to become something the world fears. Raw, uncompromising, and brutal.',
   201, ARRAY['Hindi'], ARRAY['2D','IMAX'], ARRAY['Action','Crime','Drama'],
   'A', '2023-12-01',
   '/oaHPEeC0v5XWmRH0zOmqFVJYTXi.jpg', '/a4jbFnWJeXD2KhMCsRpX6V3PKQR.jpg',
   NULL, 7.6, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 1060349,
   'Jawan', 'jawan',
   'A man driven by a personal vendetta rescues six women who have been wronged, who together take down a corrupt system threatening the country.',
   169, ARRAY['Hindi','Tamil'], ARRAY['2D','IMAX','4DX'], ARRAY['Action','Thriller'],
   'UA', '2023-09-07',
   '/cGXFosYUHYjjdKZMCXsebYMtJH8.jpg', '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
   NULL, 7.8, 1, 0, now(), now(), NULL),

  (gen_random_uuid(), 926393,
   'Fighter', 'fighter',
   'India''s first aerial action franchise. Shamsher ''Patty'' Pathania leads an elite squadron into battle, forging unbreakable bonds along the way.',
   166, ARRAY['Hindi'], ARRAY['2D','IMAX','Dolby'], ARRAY['Action','Patriotic'],
   'UA', '2024-01-25',
   '/fWFxlrKvPbR7x7F2pRFqYgdS0mD.jpg', '/p9ZUzCyy9pSBKSBKwEFqJpFkXHS.jpg',
   NULL, 7.2, 1, 0, now(), now(), NULL)
ON CONFLICT DO NOTHING;

-- ── Coming Soon movies ─────────────────────────────────────
INSERT INTO "Movies" ("Id","TmdbId","Title","Slug","Description","DurationMin","Languages","Formats","Genres","Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl","ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt") VALUES
  (gen_random_uuid(), NULL, 'War 2', 'war-2',
   'The super-spy Kabir returns for an explosive sequel in the YRF Spy Universe.', 150,
   ARRAY['Hindi'], ARRAY['2D','IMAX'], ARRAY['Action','Spy'],
   'UA', '2026-08-14', NULL, NULL, NULL, NULL, 1, 1, now(), now(), NULL),

  (gen_random_uuid(), NULL, 'Sikandar', 'sikandar',
   'A story of power, pride, and purpose — Salman Khan commands the screen.', 150,
   ARRAY['Hindi'], ARRAY['2D','IMAX'], ARRAY['Action','Drama'],
   'UA', '2026-03-30', NULL, NULL, NULL, NULL, 1, 1, now(), now(), NULL),

  (gen_random_uuid(), NULL, 'Kantara: Chapter 1', 'kantara-chapter-1',
   'The mythical prequel to the phenomenon — the origin of the Daiva.',150,
   ARRAY['Kannada','Hindi'], ARRAY['2D','IMAX'], ARRAY['Folklore','Action'],
   'UA', '2026-10-02', NULL, NULL, NULL, NULL, 1, 1, now(), now(), NULL)
ON CONFLICT DO NOTHING;

-- ── Venue + Screens (Ahmedabad) ────────────────────────────
DO $$
DECLARE
  city_id uuid;
  venue1 uuid := gen_random_uuid();
  venue2 uuid := gen_random_uuid();
  venue3 uuid := gen_random_uuid();
  screen1 uuid := gen_random_uuid();
  screen2 uuid := gen_random_uuid();
  screen3 uuid := gen_random_uuid();
BEGIN
  SELECT "Id" INTO city_id FROM "Cities" WHERE "Slug" = 'ahmedabad' LIMIT 1;

  INSERT INTO "Venues" ("Id","Name","Slug","Chain","Address","CityId","StateCode","Latitude","Longitude","Amenities","IsActive","CreatedAt","UpdatedAt","DeletedAt")
  VALUES
    (venue1, 'PVR Cinemas · Acropolis Mall', 'pvr-acropolis-ahmedabad', 'PVR',
     'Acropolis Mall, Vastrapur, Ahmedabad 380015', city_id, '24',
     23.0338, 72.5235,
     '["Parking","Food Court","M-Ticket","Recliner","Dolby"]',
     true, now(), now(), NULL),
    (venue2, 'INOX · Iscon Mega Mall', 'inox-iscon-ahmedabad', 'INOX',
     'Iscon Mega Mall, Satellite, Ahmedabad 380015', city_id, '24',
     23.0168, 72.5118,
     '["Parking","M-Ticket","Recliner","Accessible"]',
     true, now(), now(), NULL),
    (venue3, 'Cinépolis · The Pavilion', 'cinepolis-pavilion-ahmedabad', 'Cinépolis',
     'The Pavilion, SG Highway, Ahmedabad 380054', city_id, '24',
     23.0045, 72.5068,
     '["Parking","Food Court","M-Ticket","Accessible"]',
     true, now(), now(), NULL)
  ON CONFLICT DO NOTHING;

  INSERT INTO "Screens" ("Id","VenueId","Name","TotalSeats","IsActive","CreatedAt","UpdatedAt","DeletedAt")
  VALUES
    (screen1, venue1, 'Audi 1 · IMAX',   250, true, now(), now(), NULL),
    (screen2, venue2, 'Audi 2 · Dolby',  200, true, now(), now(), NULL),
    (screen3, venue3, 'Audi 1 · 2D',     180, true, now(), now(), NULL)
  ON CONFLICT DO NOTHING;
END $$;

-- ── Coupons (5 demo coupons) ───────────────────────────────
INSERT INTO "Coupons" ("Id","Code","Description","Type","Value","MaxDiscount","MinOrder","ValidFrom","ValidTo","UsageLimitPerUser","TotalUsageLimit","CurrentUsage","ApplicableCities","ApplicableMovies","ApplicableVenues","IsActive","CreatedAt","UpdatedAt","DeletedAt") VALUES
  (gen_random_uuid(),'FIRSTBOOK','First booking discount — flat ₹100 off',0,100,NULL,200,'2026-01-01','2026-12-31',1,1000,0,ARRAY[]::uuid[],ARRAY[]::uuid[],ARRAY[]::uuid[],true,now(),now(),NULL),
  (gen_random_uuid(),'MOVIE20',  '20% off on movies (max ₹120)',           1, 20, 120,300,'2026-01-01','2026-12-31',2,500, 0,ARRAY[]::uuid[],ARRAY[]::uuid[],ARRAY[]::uuid[],true,now(),now(),NULL),
  (gen_random_uuid(),'KGF450',   'KGF special — flat ₹450 off',            0,450,NULL,600,'2026-01-01','2026-12-31',1,200, 0,ARRAY[]::uuid[],ARRAY[]::uuid[],ARRAY[]::uuid[],true,now(),now(),NULL),
  (gen_random_uuid(),'CHEAPTUE', 'Tuesday special — 15% off (max ₹80)',    1, 15,  80,150,'2026-01-01','2026-12-31',1,999, 0,ARRAY[]::uuid[],ARRAY[]::uuid[],ARRAY[]::uuid[],true,now(),now(),NULL),
  (gen_random_uuid(),'AHMDVIBE', 'Ahmedabad special — flat ₹60 off',       0, 60,NULL,200,'2026-01-01','2026-12-31',1,500, 0,ARRAY[]::uuid[],ARRAY[]::uuid[],ARRAY[]::uuid[],true,now(),now(),NULL)
ON CONFLICT DO NOTHING;

-- ── Shows (today + next 6 days × 3 venues × 2-3 shows) ────
DO $$
DECLARE
  screen1 uuid;
  screen2 uuid;
  screen3 uuid;
  venue1  uuid;
  venue2  uuid;
  venue3  uuid;
  movie1  uuid;  -- KGF2
  movie2  uuid;  -- Chhaava
  movie3  uuid;  -- Pushpa2
  today   date := current_date;
BEGIN
  SELECT s."Id", s."VenueId" INTO screen1, venue1 FROM "Screens" s JOIN "Venues" v ON s."VenueId"=v."Id" WHERE v."Slug"='pvr-acropolis-ahmedabad' LIMIT 1;
  SELECT s."Id", s."VenueId" INTO screen2, venue2 FROM "Screens" s JOIN "Venues" v ON s."VenueId"=v."Id" WHERE v."Slug"='inox-iscon-ahmedabad' LIMIT 1;
  SELECT s."Id", s."VenueId" INTO screen3, venue3 FROM "Screens" s JOIN "Venues" v ON s."VenueId"=v."Id" WHERE v."Slug"='cinepolis-pavilion-ahmedabad' LIMIT 1;
  SELECT "Id" INTO movie1 FROM "Movies" WHERE "Slug"='kgf-chapter-2' LIMIT 1;
  SELECT "Id" INTO movie2 FROM "Movies" WHERE "Slug"='chhaava' LIMIT 1;
  SELECT "Id" INTO movie3 FROM "Movies" WHERE "Slug"='pushpa-2-the-rule' LIMIT 1;

  FOR i IN 0..6 LOOP
    -- PVR: KGF2 IMAX 10AM + 7:45PM
    INSERT INTO "Shows" ("Id","ScreenId","VenueId","MovieId","EventId","ShowDate","ShowTime","ShowDatetime","Format","Language","PriceOverrides","Status","CreatedAt","UpdatedAt","DeletedAt")
    VALUES
      (gen_random_uuid(),screen1,venue1,movie1,NULL, today+i, '10:00:00', (today+i)::timestamp+'10:00:00'::time, 'IMAX',  'Hindi', '{"recliner":650,"executive":420,"normal":260}', 0, now(),now(),NULL),
      (gen_random_uuid(),screen1,venue1,movie1,NULL, today+i, '19:45:00', (today+i)::timestamp+'19:45:00'::time, 'IMAX',  'Hindi', '{"recliner":650,"executive":420,"normal":260}', 0, now(),now(),NULL),
    -- INOX: Chhaava Dolby 1PM + 6PM
      (gen_random_uuid(),screen2,venue2,movie2,NULL, today+i, '13:00:00', (today+i)::timestamp+'13:00:00'::time, 'Dolby', 'Hindi', '{"recliner":580,"executive":360,"normal":220}', 0, now(),now(),NULL),
      (gen_random_uuid(),screen2,venue2,movie2,NULL, today+i, '18:00:00', (today+i)::timestamp+'18:00:00'::time, 'Dolby', 'Hindi', '{"recliner":580,"executive":360,"normal":220}', 0, now(),now(),NULL),
    -- Cinépolis: Pushpa2 2D 11:30AM + 4:30PM
      (gen_random_uuid(),screen3,venue3,movie3,NULL, today+i, '11:30:00', (today+i)::timestamp+'11:30:00'::time, '2D',    'Telugu','{"recliner":500,"executive":300,"normal":180}', 0, now(),now(),NULL),
      (gen_random_uuid(),screen3,venue3,movie3,NULL, today+i, '16:30:00', (today+i)::timestamp+'16:30:00'::time, '2D',    'Telugu','{"recliner":500,"executive":300,"normal":180}', 0, now(),now(),NULL)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
