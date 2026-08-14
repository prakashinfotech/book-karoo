-- Migration 010: Add password_changed_at to "Users" table
-- Run in Supabase SQL Editor

ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "PasswordChangedAt" timestamptz NULL;
