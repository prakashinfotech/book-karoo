-- Migration 005: Change Users email unique index to partial (exclude soft-deleted rows)
-- This allows a user to re-register with the same email after deleting their account.

-- Drop the old full unique index
DROP INDEX IF EXISTS "ix_users_email";

-- Create a partial unique index that only enforces uniqueness on active (non-deleted) users
CREATE UNIQUE INDEX "ix_users_email" ON "Users" ("email") WHERE "deleted_at" IS NULL;
