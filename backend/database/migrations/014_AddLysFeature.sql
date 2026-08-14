-- ── ListYourShow (LYS) Migration ─────────────────────────────────────────────
-- Adds organizer self-service event listing tables and extends Bookings for
-- commission tracking. CancelledAt was already present in Bookings from 001.

-- ── LysOrganizers ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LysOrganizers" (
    "Id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
    "UserId"      uuid        NOT NULL,
    "Name"        text        NOT NULL,
    "Email"       text        NOT NULL,
    "Phone"       text        NOT NULL,
    "PanNumber"   text        NOT NULL,
    "IsVerified"  boolean     NOT NULL DEFAULT false,
    "IsActive"    boolean     NOT NULL DEFAULT true,
    "VerifiedAt"  timestamptz,
    "VerifiedBy"  uuid,
    "Notes"       text,
    "CreatedAt"   timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt"   timestamptz NOT NULL DEFAULT now(),
    "DeletedAt"   timestamptz,
    CONSTRAINT "PK_LysOrganizers" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_LysOrganizers_UserId"
    ON "LysOrganizers" ("UserId") WHERE "DeletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IX_LysOrganizers_PanNumber"
    ON "LysOrganizers" ("PanNumber") WHERE "DeletedAt" IS NULL;

-- ── LysEvents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LysEvents" (
    "Id"                  uuid        NOT NULL DEFAULT gen_random_uuid(),
    "OrganizerId"         uuid        NOT NULL,
    "Title"               text        NOT NULL,
    "Slug"                text        NOT NULL,
    "Type"                text        NOT NULL,
    "Description"         text        NOT NULL,
    "VenueType"           text        NOT NULL DEFAULT 'custom',
    "VenueId"             uuid,
    "CustomVenueName"     text,
    "CustomVenueAddress"  text,
    "CustomVenueCity"     text,
    "EventDate"           timestamptz NOT NULL,
    "DurationMin"         integer,
    "Language"            text        NOT NULL DEFAULT 'Hindi',
    "AgeRestriction"      integer     NOT NULL DEFAULT 0,
    "ArtistsJson"         text,
    "PosterUrl"           text,
    "BackdropUrl"         text,
    "PriceTiersJson"      text        NOT NULL DEFAULT '[]',
    "Status"              text        NOT NULL DEFAULT 'draft',
    "SubmittedAt"         timestamptz,
    "ReviewedAt"          timestamptz,
    "ReviewedBy"          uuid,
    "ReviewNotes"         text,
    "CommissionRate"      numeric(5,2) NOT NULL DEFAULT 5.00,
    "PublishedEventId"    uuid,
    "CreatedAt"           timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt"           timestamptz NOT NULL DEFAULT now(),
    "DeletedAt"           timestamptz,
    CONSTRAINT "PK_LysEvents" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_LysEvents_Slug"
    ON "LysEvents" ("Slug") WHERE "DeletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "IX_LysEvents_OrganizerId"
    ON "LysEvents" ("OrganizerId");
CREATE INDEX IF NOT EXISTS "IX_LysEvents_Status"
    ON "LysEvents" ("Status");

-- ── LysUploads ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "LysUploads" (
    "Id"           uuid        NOT NULL DEFAULT gen_random_uuid(),
    "OrganizerId"  uuid        NOT NULL,
    "LysEventId"   uuid,
    "FileName"     text        NOT NULL,
    "StoragePath"  text        NOT NULL,
    "PublicUrl"    text        NOT NULL,
    "FileSize"     bigint,
    "MimeType"     text,
    "CreatedAt"    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "PK_LysUploads" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_LysUploads_OrganizerId"
    ON "LysUploads" ("OrganizerId");

-- ── Bookings — add LYS commission columns ────────────────────────────────────
-- "CancelledAt" already exists from 001_initial_schema.sql
ALTER TABLE "Bookings"
    ADD COLUMN IF NOT EXISTS "LysEventId"       uuid,
    ADD COLUMN IF NOT EXISTS "CommissionAmount"  numeric(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "CommissionRate"    numeric(5,2)  NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "IX_Bookings_LysEventId"
    ON "Bookings" ("LysEventId") WHERE "LysEventId" IS NOT NULL;
