-- Add ContactPhone and ContactEmail columns to Venues table
ALTER TABLE "Venues"
  ADD COLUMN IF NOT EXISTS "ContactPhone" text,
  ADD COLUMN IF NOT EXISTS "ContactEmail" text;
