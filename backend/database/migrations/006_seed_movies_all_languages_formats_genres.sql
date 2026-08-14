-- ============================================================
-- BookKaroo — Migration 006
-- Seed movies covering ALL filters on /movies page:
--   Languages : Hindi, English, Tamil, Telugu, Malayalam,
--               Kannada, Marathi, Bengali, Punjabi, Gujarati
--   Formats   : 2D, 3D, IMAX, 4DX, Dolby Cinema
--   Genres    : Action, Comedy, Drama, Romance, Thriller, Horror,
--               Sci-Fi, Animation, Documentary, Biography, Musical
--   Categories: NowShowing(0), ComingSoon(1), Exclusive(2), Premiere(3)
--
-- Poster / backdrop paths are TMDB image paths.
-- Source: https://www.themoviedb.org
--   → open movie page, click poster, copy URL, take the path after /t/p/original/
--
-- Status:  0=Draft | 1=Published | 2=Archived
-- Category: 0=NowShowing | 1=ComingSoon | 2=Exclusive | 3=Premiere
--
-- Run AFTER 002_seed_data.sql
-- ============================================================

-- ── Fix existing seed: "Dolby" → "Dolby Cinema" to match frontend filter ──
UPDATE "Movies"
SET "Formats" = array_replace("Formats", 'Dolby', 'Dolby Cinema')
WHERE 'Dolby' = ANY("Formats");

-- ============================================================
-- NOW SHOWING  (Status=1, Category=0)
-- ============================================================
INSERT INTO "Movies" (
  "Id","TmdbId","Title","Slug","Description",
  "DurationMin","Languages","Formats","Genres",
  "Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl",
  "ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt"
) VALUES

-- ── English · IMAX · 3D · Dolby Cinema · Biography · Drama ───────────────
(gen_random_uuid(), 872585,
 'Oppenheimer', 'oppenheimer',
 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II. A gripping portrait of genius, moral ambiguity, and catastrophic consequence.',
 180, ARRAY['English','Hindi'], ARRAY['2D','IMAX','Dolby Cinema'],
 ARRAY['Biography','Drama','History'],
 'UA', '2023-07-21',
 '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', '/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
 'https://www.youtube.com/watch?v=uYPbbksJxIg',
 8.9, 1, 0, now(), now(), NULL),

-- ── English · 3D · Dolby Cinema · Sci-Fi · Action ────────────────────────
(gen_random_uuid(), 693134,
 'Dune: Part Two', 'dune-part-two',
 'Paul Atreides unites with the Fremen of Arrakis to wage war against those who destroyed his family. As he embraces his destiny, he must choose between the love of his life and the fate of the known universe.',
 166, ARRAY['English','Hindi'], ARRAY['2D','IMAX','3D','Dolby Cinema'],
 ARRAY['Sci-Fi','Action','Adventure'],
 'UA', '2024-03-01',
 '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', '/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
 'https://www.youtube.com/watch?v=Way9Dexny3w',
 8.5, 1, 0, now(), now(), NULL),

-- ── Hindi · Telugu · Tamil · 4DX · 3D · Sci-Fi · Action ─────────────────
(gen_random_uuid(), 1064028,
 'Kalki 2898 AD', 'kalki-2898-ad',
 'Set in a futuristic dystopia, an immortal bounty hunter crosses paths with a rebel and a pregnant woman who may hold the key to humanity''s salvation. A mythological saga reimagined for the future.',
 181, ARRAY['Hindi','Telugu','Tamil','Malayalam'], ARRAY['2D','IMAX','3D','4DX'],
 ARRAY['Sci-Fi','Action','Mythology'],
 'UA', '2024-06-27',
 '/kbSOGiyCspiV2VeYHOE4ZxIIIDP.jpg', '/6XYGPOAPEvnMYpIWiSqDerAJBdp.jpg',
 'https://www.youtube.com/watch?v=iMF7-_qEkow',
 7.2, 1, 0, now(), now(), NULL),

-- ── Kannada · Action · Drama ─────────────────────────────────────────────
(gen_random_uuid(), 882634,
 'Kantara', 'kantara',
 'A forest department officer locks horns with a local hero over land encroachment, leading to a clash of traditions and a supernatural reckoning deeply rooted in coastal Karnataka folklore.',
 148, ARRAY['Kannada','Hindi','Tamil','Telugu'], ARRAY['2D'],
 ARRAY['Action','Drama','Thriller','Mystery'],
 'A', '2022-09-30',
 '/dt6wO6nxGpFCGT3rnqCFGGiAqxn.jpg', '/3EyBK0GHrXkNjlBUTmTXz0q6zom.jpg',
 'https://www.youtube.com/watch?v=sOEg_YZQsTI',
 8.4, 1, 0, now(), now(), NULL),

-- ── Malayalam · Adventure · Drama · Thriller ─────────────────────────────
(gen_random_uuid(), 1218077,
 'Manjummel Boys', 'manjummel-boys',
 'Based on a true story: a group of friends from Manjummel, Ernakulam go on a trip to Kodaikanal. When one of them falls into the Guna Caves — notoriously called Devil''s Kitchen — the others launch a daring rescue.',
 137, ARRAY['Malayalam'], ARRAY['2D'],
 ARRAY['Adventure','Drama','Thriller'],
 'UA', '2024-02-22',
 '/qTgX4sNPtCEXCUfRdaWqEGl3BgT.jpg', '/h5JF1tFZ7VGsWRQfWzJwbD8k7Dy.jpg',
 NULL,
 8.5, 1, 0, now(), now(), NULL),

-- ── Punjabi · Hindi · Biography · Action · Romance ────────────────────────
(gen_random_uuid(), 866015,
 'Shershaah', 'shershaah',
 'The true story of Captain Vikram Batra, PVC — the fearless Indian Army officer who recaptured peaks from Pakistani forces during the Kargil War of 1999. A soldier, a lover, a legend.',
 135, ARRAY['Hindi','Punjabi'], ARRAY['2D'],
 ARRAY['Biography','Action','Romance','War'],
 'UA', '2021-08-12',
 '/dkzO69WgIqiRIoV0dTovtl6SCGH.jpg', '/oQhXCu7BKJCQ0T4GCiJCIFCDgC7.jpg',
 'https://www.youtube.com/watch?v=MfSWeCAZxqA',
 7.6, 1, 0, now(), now(), NULL),

-- ── Hindi · Biography · Drama · Musical ──────────────────────────────────
(gen_random_uuid(), 812378,
 'Gangubai Kathiawadi', 'gangubai-kathiawadi',
 'The story of a young girl from Kathiawad who sold into prostitution — and rose to become one of the most powerful, beloved, and formidable women in Mumbai''s Kamathipura district.',
 152, ARRAY['Hindi'], ARRAY['2D'],
 ARRAY['Biography','Drama','Crime','Musical'],
 'UA', '2022-02-25',
 '/cwNReMQFaRf7hqNaJu8zVWHIqzR.jpg', '/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg',
 'https://www.youtube.com/watch?v=j3VUf4EJKPY',
 7.1, 1, 0, now(), now(), NULL),

-- ── Tamil · Documentary ───────────────────────────────────────────────────
(gen_random_uuid(), 935885,
 'The Elephant Whisperers', 'the-elephant-whisperers',
 'An indigenous couple from Tamil Nadu devote their lives to raising Raghu, an orphaned baby elephant. An Oscar-winning documentary about the bond between humans and nature at its most profound.',
 39, ARRAY['Tamil','English'], ARRAY['2D'],
 ARRAY['Documentary'],
 'U', '2022-12-02',
 '/5pFoMwHp9jNWPAiV2J3JtFZVFam.jpg', '/mWBMKK6LMJI0NNXgTCvFJJdRGJT.jpg',
 NULL,
 7.8, 1, 0, now(), now(), NULL),

-- ── Hindi · Thriller · Mystery ────────────────────────────────────────────
(gen_random_uuid(), 592350,
 'Andhadhun', 'andhadhun',
 'A seemingly blind pianist accidentally becomes a witness to a murder. Now both the perpetrators and the police are after him — and nothing, absolutely nothing, is what it seems.',
 139, ARRAY['Hindi'], ARRAY['2D'],
 ARRAY['Thriller','Mystery','Crime','Comedy'],
 'UA', '2018-10-05',
 '/9ov1Y4pJiLyGTjzD4uEbDWCXHH0.jpg', '/xGexKgXdcFkr2aNmZGJMj0eFhRL.jpg',
 'https://www.youtube.com/watch?v=B3GFLs06eFo',
 8.3, 1, 0, now(), now(), NULL),

-- ── English · Hindi · Animation · Comedy ─────────────────────────────────
(gen_random_uuid(), 315162,
 'Puss in Boots: The Last Wish', 'puss-in-boots-the-last-wish',
 'Puss in Boots discovers that his passion for adventure has taken its toll: he has burned through eight of his nine lives. He must find the mythical Last Wish and restore his nine lives before it is too late.',
 100, ARRAY['English','Hindi'], ARRAY['2D','3D'],
 ARRAY['Animation','Comedy','Adventure','Family'],
 'U', '2022-12-21',
 '/kuf6dutpsT0vSVehic3EZIqkOBt.jpg', '/1X7vow16X7CnCoexXh4H4F2yDJv.jpg',
 'https://www.youtube.com/watch?v=tNbFsKcMois',
 7.9, 1, 0, now(), now(), NULL),

-- ── Gujarati · Drama · Comedy ────────────────────────────────────────────
(gen_random_uuid(), 876220,
 'Chhello Show', 'chhello-show',
 'Set in 1990s rural Gujarat, a nine-year-old boy becomes obsessed with the magic of cinema. This is the story of his friendship with the cinema''s projector operator — and how movies changed his life forever.',
 112, ARRAY['Gujarati','Hindi'], ARRAY['2D'],
 ARRAY['Drama','Comedy','Family'],
 'U', '2021-10-14',
 '/8WdCdqVaHrYvuHPVCRhNaJiCBFV.jpg', NULL,
 NULL,
 7.9, 1, 0, now(), now(), NULL),

-- ── Hindi · Romance · Comedy · Drama ─────────────────────────────────────
(gen_random_uuid(), 946472,
 'Rocky Aur Rani Kii Prem Kahaani', 'rocky-aur-rani-kii-prem-kahaani',
 'Rocky, a gregarious Punjabi boy, and Rani, an intellectual Bengali journalist, fall in love. They agree to live in each other''s families before marriage — sparking a colourful clash of cultures and heartfelt revelations.',
 168, ARRAY['Hindi'], ARRAY['2D'],
 ARRAY['Romance','Comedy','Drama'],
 'UA', '2023-07-28',
 '/jEBMJgEkTVvXejzLSTyiEVBFPLs.jpg', '/cGBFpHUgF1B5OM0g0H7lbMqAe1R.jpg',
 'https://www.youtube.com/watch?v=DCUQGJ3f91w',
 6.8, 1, 0, now(), now(), NULL),

-- ── Bengali · Biography · Drama ───────────────────────────────────────────
(gen_random_uuid(), NULL,
 'Aparajito', 'aparajito-2022',
 'A biographical drama on the life of legendary filmmaker Satyajit Ray, tracing his creative journey from a struggling artist to an internationally acclaimed genius who put Indian cinema on the world map.',
 141, ARRAY['Bengali','Hindi'], ARRAY['2D'],
 ARRAY['Biography','Drama'],
 'UA', '2022-05-20',
 NULL, NULL, NULL,
 8.1, 1, 0, now(), now(), NULL),

-- ── Hindi · Marathi · Horror · Fantasy ───────────────────────────────────
(gen_random_uuid(), 573435,
 'Tumbbad', 'tumbbad',
 'A mythological story about a man who discovers a hidden treasure in his ancestral home guarded by a forgotten deity. Spanning generations, it is a haunting tale of greed, myth, and the monstrous cost of obsession.',
 104, ARRAY['Hindi','Marathi'], ARRAY['2D'],
 ARRAY['Horror','Fantasy','Drama','Thriller'],
 'UA', '2018-10-12',
 '/3DPqxN4E6w0lJBt4kAMJWiT2Ddk.jpg', '/mVvAiY6IbSPIclVSUuJrb2dLMHZ.jpg',
 'https://www.youtube.com/watch?v=c2QgWqc1Aag',
 8.3, 1, 0, now(), now(), NULL),

-- ── Hindi · Biography · Drama (12th Fail) ────────────────────────────────
(gen_random_uuid(), 1138291,
 '12th Fail', '12th-fail',
 'Based on a true story: a young man from a small village in Madhya Pradesh repeatedly fails his 12th board exams but refuses to quit. Against impossible odds, he finds a path to becoming an IPS officer.',
 147, ARRAY['Hindi'], ARRAY['2D'],
 ARRAY['Biography','Drama'],
 'UA', '2023-10-27',
 '/flPMqNLtl7bHd1cFM5DmGXS9nPD.jpg', '/cEAbAP5qzHJhc8HxBwXSEMhcS8C.jpg',
 'https://www.youtube.com/watch?v=yatMNs5mCDo',
 9.0, 1, 0, now(), now(), NULL),

-- ── Hindi · Thriller · Drama (Article 370) ───────────────────────────────
(gen_random_uuid(), NULL,
 'Article 370', 'article-370',
 'A political thriller depicting the abrogation of Article 370 in Jammu & Kashmir. A female intelligence officer races against time and opposition to execute one of the most consequential decisions in modern Indian history.',
 155, ARRAY['Hindi'], ARRAY['2D','IMAX'],
 ARRAY['Thriller','Drama','Political'],
 'UA', '2024-02-23',
 NULL, NULL, NULL,
 8.3, 1, 0, now(), now(), NULL),

-- ── Telugu · Hindi · Action · Thriller (Devara) ──────────────────────────
(gen_random_uuid(), NULL,
 'Devara: Part 1', 'devara-part-1',
 'A fearsome sea-lord''s legacy of dominance is threatened decades later when his timid son is forced to confront the same violent world — and must find the monster within to survive it.',
 166, ARRAY['Telugu','Hindi','Tamil'], ARRAY['2D','IMAX','3D'],
 ARRAY['Action','Thriller','Drama'],
 'UA', '2024-09-27',
 NULL, NULL, NULL,
 6.5, 1, 0, now(), now(), NULL)

ON CONFLICT DO NOTHING;

-- ============================================================
-- COMING SOON  (Status=1, Category=1)
-- ============================================================
INSERT INTO "Movies" (
  "Id","TmdbId","Title","Slug","Description",
  "DurationMin","Languages","Formats","Genres",
  "Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl",
  "ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt"
) VALUES

-- ── Tamil · Hindi · Action (Coolie) ──────────────────────────────────────
(gen_random_uuid(), NULL,
 'Coolie', 'coolie-2025',
 'Rajinikanth stars as a railway coolie with a secret past. A high-octane action saga about identity, justice, and the fury of a man who has been pushed to his absolute limit.',
 0, ARRAY['Tamil','Hindi','Telugu'], ARRAY['2D','IMAX'],
 ARRAY['Action','Thriller'],
 'UA', '2025-08-14',
 NULL, NULL, NULL,
 NULL, 1, 1, now(), now(), NULL),

-- ── Hindi · Punjabi · Action · Biography ─────────────────────────────────
(gen_random_uuid(), NULL,
 'Kesari Chapter 2: The Untold Story of Jallianwala Bagh', 'kesari-chapter-2',
 'The sequel revisits one of India''s most harrowing historical events — the Jallianwala Bagh massacre — from a new perspective, uncovering the political forces behind the tragedy and the fight for justice that followed.',
 0, ARRAY['Hindi','Punjabi'], ARRAY['2D','IMAX'],
 ARRAY['Biography','Action','Historical','Drama'],
 'UA', '2025-04-18',
 NULL, NULL, NULL,
 NULL, 1, 1, now(), now(), NULL),

-- ── Malayalam · Coming Soon ───────────────────────────────────────────────
(gen_random_uuid(), NULL,
 'L2: Empuraan', 'l2-empuraan',
 'The highly anticipated sequel to Lucifer — Stephen Nedumpally''s past catches up with him as he is drawn back into a global conflict that threatens everything he has built.',
 0, ARRAY['Malayalam','Hindi','Tamil'], ARRAY['2D','IMAX'],
 ARRAY['Action','Thriller','Crime'],
 'UA', '2025-03-27',
 NULL, NULL, NULL,
 NULL, 1, 1, now(), now(), NULL)

ON CONFLICT DO NOTHING;

-- ============================================================
-- EXCLUSIVE  (Status=1, Category=2)
-- ============================================================
INSERT INTO "Movies" (
  "Id","TmdbId","Title","Slug","Description",
  "DurationMin","Languages","Formats","Genres",
  "Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl",
  "ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt"
) VALUES

-- ── Tamil · Dolby Cinema · Biography · Drama ─────────────────────────────
(gen_random_uuid(), 854181,
 'Soorarai Pottru', 'soorarai-pottru',
 'Based on the life of Air Deccan founder G. R. Gopinath — a soldier-turned-entrepreneur who dared to dream of affordable air travel for every Indian. An exclusive BookKaroo re-screening of this acclaimed national award winner.',
 153, ARRAY['Tamil','Hindi'], ARRAY['2D','Dolby Cinema'],
 ARRAY['Biography','Drama'],
 'UA', '2020-11-12',
 '/xvaqJkiL2FeVZLKbHKPmJFAIfue.jpg', '/8I4qBBvIjJFBwxN0cPQP5C6p2UP.jpg',
 'https://www.youtube.com/watch?v=sKfPESSZA0E',
 8.7, 1, 2, now(), now(), NULL),

-- ── English · Sci-Fi · Exclusive ─────────────────────────────────────────
(gen_random_uuid(), 157336,
 'Interstellar', 'interstellar',
 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival. An exclusive IMAX 10th-anniversary remaster — Christopher Nolan''s masterpiece on the biggest screen possible.',
 169, ARRAY['English','Hindi'], ARRAY['IMAX','2D','Dolby Cinema'],
 ARRAY['Sci-Fi','Drama','Adventure'],
 'UA', '2014-11-07',
 '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
 8.7, 1, 2, now(), now(), NULL)

ON CONFLICT DO NOTHING;

-- ============================================================
-- PREMIERES  (Status=1, Category=3)
-- ============================================================
INSERT INTO "Movies" (
  "Id","TmdbId","Title","Slug","Description",
  "DurationMin","Languages","Formats","Genres",
  "Certificate","ReleaseDate","PosterUrl","BackdropUrl","TrailerUrl",
  "ImdbRating","Status","Category","CreatedAt","UpdatedAt","DeletedAt"
) VALUES

-- ── Hindi · Gujarati · Romance · Musical · Premiere ──────────────────────
(gen_random_uuid(), NULL,
 'Loveyapa', 'loveyapa',
 'BookKaroo Premiere: A modern love story set across Mumbai and Gujarat — two families, two worldviews, one couple caught in the middle. A heartwarming musical celebration of love that transcends differences.',
 0, ARRAY['Hindi','Gujarati'], ARRAY['2D','Dolby Cinema'],
 ARRAY['Romance','Musical','Comedy'],
 'UA', '2025-02-07',
 NULL, NULL, NULL,
 NULL, 1, 3, now(), now(), NULL),

-- ── Bengali · Drama · Premiere ────────────────────────────────────────────
(gen_random_uuid(), NULL,
 'Durgeshgorer Guptodhan', 'durgeshgorer-guptodhan',
 'BookKaroo Premiere: A Bengali adventure film following a professor and a group of young students who uncover a century-old mystery hidden in a crumbling zamindar mansion — and the treasure that comes with it.',
 128, ARRAY['Bengali'], ARRAY['2D'],
 ARRAY['Adventure','Drama','Mystery'],
 'UA', '2019-05-31',
 NULL, NULL, NULL,
 7.8, 1, 3, now(), now(), NULL)

ON CONFLICT DO NOTHING;

-- ============================================================
-- Verification query — run this to confirm coverage
-- ============================================================
/*
SELECT
  unnest("Languages")                          AS lang,
  COUNT(*)                                     AS movie_count
FROM "Movies"
WHERE "DeletedAt" IS NULL AND "Status" = 1
GROUP BY lang ORDER BY lang;

SELECT
  unnest("Formats")                            AS fmt,
  COUNT(*)                                     AS movie_count
FROM "Movies"
WHERE "DeletedAt" IS NULL AND "Status" = 1
GROUP BY fmt ORDER BY fmt;

SELECT
  unnest("Genres")                             AS genre,
  COUNT(*)                                     AS movie_count
FROM "Movies"
WHERE "DeletedAt" IS NULL AND "Status" = 1
GROUP BY genre ORDER BY genre;

SELECT
  CASE "Category"
    WHEN 0 THEN 'NowShowing'
    WHEN 1 THEN 'ComingSoon'
    WHEN 2 THEN 'Exclusive'
    WHEN 3 THEN 'Premiere'
  END                                          AS category,
  COUNT(*)                                     AS movie_count
FROM "Movies"
WHERE "DeletedAt" IS NULL AND "Status" = 1
GROUP BY "Category" ORDER BY "Category";
*/
