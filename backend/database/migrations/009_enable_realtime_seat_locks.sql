-- ============================================================
-- BookKaroo — Migration 009
-- Enable Supabase Realtime on SeatLocks table so that
-- DELETE events (seat deselected) fire correctly for other
-- users watching the seat map.
--
-- Without this:
--   - INSERT events work  → User2 sees seats lock in real-time ✓
--   - DELETE events fail  → User2 never sees seats UNLOCK      ✗
--     (payload.old.seat_label is undefined, filter doesn't match)
--
-- Root cause: PostgreSQL's default REPLICA IDENTITY only puts
-- the primary key in the OLD record for WAL DELETE events.
-- Supabase Realtime needs REPLICA IDENTITY FULL to read
-- non-PK columns (like SeatLabel, ShowId) from the deleted row.
--
-- Run this ONCE in Supabase → SQL Editor.
-- ============================================================

-- Step 1: Set REPLICA IDENTITY FULL so all columns are included
-- in the OLD record for every DELETE event on this table.
ALTER TABLE "SeatLocks" REPLICA IDENTITY FULL;

-- Step 2: Add SeatLocks to the Supabase Realtime publication
-- so Supabase streams its changes (INSERT / UPDATE / DELETE).
-- "supabase_realtime" is the default publication name.
ALTER PUBLICATION supabase_realtime ADD TABLE "SeatLocks";

-- ── Verify ────────────────────────────────────────────────────────────────
-- Run this SELECT to confirm the settings applied:
/*
SELECT
  c.relname                   AS table_name,
  c.relreplident              AS replica_identity,
  -- 'f' = FULL, 'd' = DEFAULT, 'n' = NOTHING, 'i' = INDEX
  CASE c.relreplident
    WHEN 'f' THEN 'FULL (correct ✓)'
    WHEN 'd' THEN 'DEFAULT (missing — run migration 009)'
    ELSE           c.relreplident::text
  END                         AS replica_identity_label
FROM   pg_class c
JOIN   pg_namespace n ON n.oid = c.relnamespace
WHERE  n.nspname = 'public'
  AND  c.relname = 'SeatLocks';

-- Also confirm it is in the publication:
SELECT tablename
FROM   pg_publication_tables
WHERE  pubname = 'supabase_realtime'
  AND  tablename = 'SeatLocks';
*/
