-- ── Partner Portal Migration ──────────────────────────────────────────────
-- UserRole enum extended in C#: User=0, Admin=1, Partner=2
-- Existing Users.Role column (int) already stores the enum value, no schema change needed.

CREATE TABLE IF NOT EXISTS "PartnerProfiles" (
    "Id"            uuid        NOT NULL,
    "UserId"        uuid        NOT NULL,
    "BusinessName"  text        NOT NULL,
    "ContactPerson" text        NOT NULL,
    "ContactPhone"  text        NOT NULL,
    "ContactEmail"  text        NOT NULL,
    "GstNumber"     text,
    "PanNumber"     text,
    "BankAccount"   text,
    "IfscCode"      text,
    "IsActive"      boolean     NOT NULL DEFAULT true,
    "Notes"         text,
    "CreatedBy"     uuid,
    "CreatedAt"     timestamptz NOT NULL DEFAULT now(),
    "UpdatedAt"     timestamptz NOT NULL DEFAULT now(),
    "DeletedAt"     timestamptz,
    CONSTRAINT "PK_PartnerProfiles" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_PartnerProfiles_UserId"
    ON "PartnerProfiles" ("UserId") WHERE "DeletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "IX_PartnerProfiles_IsActive"
    ON "PartnerProfiles" ("IsActive");

CREATE TABLE IF NOT EXISTS "PartnerVenueAccesses" (
    "Id"         uuid        NOT NULL,
    "PartnerId"  uuid        NOT NULL,
    "VenueId"    uuid        NOT NULL,
    "GrantedBy"  uuid,
    "GrantedAt"  timestamptz NOT NULL DEFAULT now(),
    "IsActive"   boolean     NOT NULL DEFAULT true,
    CONSTRAINT "PK_PartnerVenueAccesses" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_PartnerVenueAccesses_Partner_Venue" UNIQUE ("PartnerId", "VenueId")
);

CREATE INDEX IF NOT EXISTS "IX_PartnerVenueAccesses_PartnerId"
    ON "PartnerVenueAccesses" ("PartnerId");
CREATE INDEX IF NOT EXISTS "IX_PartnerVenueAccesses_VenueId"
    ON "PartnerVenueAccesses" ("VenueId");
