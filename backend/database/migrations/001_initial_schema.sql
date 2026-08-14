CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "AuditLogs" (
        "Id" uuid NOT NULL,
        "UserId" uuid,
        "Action" text NOT NULL,
        "EntityType" text NOT NULL,
        "EntityId" uuid,
        "Before" text,
        "After" text,
        "Ip" text,
        "UserAgent" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_AuditLogs" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Bookings" (
        "Id" uuid NOT NULL,
        "BookingRef" text NOT NULL,
        "UserId" uuid NOT NULL,
        "ShowId" uuid NOT NULL,
        "TicketQty" integer NOT NULL,
        "TicketAmount" numeric(10,2) NOT NULL,
        "ConvenienceFee" numeric(10,2) NOT NULL,
        "OfferProcessingFee" numeric(10,2) NOT NULL,
        "TaxableAmount" numeric(10,2) NOT NULL,
        "Cgst" numeric(10,2) NOT NULL,
        "Sgst" numeric(10,2) NOT NULL,
        "Igst" numeric(10,2) NOT NULL,
        "Discount" numeric(10,2) NOT NULL,
        "AmountPaid" numeric(10,2) NOT NULL,
        "CustomerStateCode" text NOT NULL,
        "CouponId" uuid,
        "Status" integer NOT NULL,
        "InvoiceNumber" text,
        "InvoiceUrl" text,
        "QrUrl" text,
        "PaymentMethodLabel" text,
        "CancelledAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Bookings" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "BookingSeats" (
        "Id" uuid NOT NULL,
        "BookingId" uuid NOT NULL,
        "SeatLabel" text NOT NULL,
        "Category" text NOT NULL,
        "Price" numeric(10,2) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_BookingSeats" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Cities" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Slug" text NOT NULL,
        "State" text NOT NULL,
        "StateCode" text NOT NULL,
        "Country" text NOT NULL,
        "Latitude" double precision NOT NULL,
        "Longitude" double precision NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Cities" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "CmsBanners" (
        "Id" uuid NOT NULL,
        "Title" text NOT NULL,
        "ImageUrl" text,
        "LinkUrl" text,
        "Position" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "StartsAt" timestamp with time zone,
        "EndsAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_CmsBanners" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Coupons" (
        "Id" uuid NOT NULL,
        "Code" text NOT NULL,
        "Description" text,
        "Type" integer NOT NULL,
        "Value" numeric(10,2) NOT NULL,
        "MaxDiscount" numeric(10,2),
        "MinOrder" numeric(10,2) NOT NULL,
        "ValidFrom" timestamp with time zone NOT NULL,
        "ValidTo" timestamp with time zone NOT NULL,
        "UsageLimitPerUser" integer NOT NULL,
        "TotalUsageLimit" integer,
        "CurrentUsage" integer NOT NULL,
        "ApplicableCities" uuid[] NOT NULL,
        "ApplicableMovies" uuid[] NOT NULL,
        "ApplicableVenues" uuid[] NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Coupons" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "CouponUsages" (
        "Id" uuid NOT NULL,
        "CouponId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "BookingId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_CouponUsages" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Events" (
        "Id" uuid NOT NULL,
        "Title" text NOT NULL,
        "Slug" text NOT NULL,
        "Type" integer NOT NULL,
        "Description" text,
        "VenueId" uuid,
        "EventDate" timestamp with time zone,
        "DurationMin" integer NOT NULL,
        "Language" text,
        "AgeRestriction" integer,
        "Organizer" text,
        "Artists" text,
        "PosterUrl" text,
        "BackdropUrl" text,
        "PriceTiers" text,
        "Status" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Events" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "IdempotencyKeys" (
        "Key" character varying(200) NOT NULL,
        "UserId" uuid,
        "Endpoint" text NOT NULL,
        "Response" text,
        "StatusCode" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_IdempotencyKeys" PRIMARY KEY ("Key")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Movies" (
        "Id" uuid NOT NULL,
        "TmdbId" integer,
        "Title" text NOT NULL,
        "Slug" text NOT NULL,
        "Description" text,
        "DurationMin" integer NOT NULL,
        "Languages" text[] NOT NULL,
        "Formats" text[] NOT NULL,
        "Genres" text[] NOT NULL,
        movie_cast text,
        "Crew" text,
        "Certificate" text,
        "ReleaseDate" date,
        "PosterUrl" text,
        "BackdropUrl" text,
        "TrailerUrl" text,
        "ImdbRating" numeric(4,1),
        "Status" integer NOT NULL,
        "Category" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Movies" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Notifications" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Type" text NOT NULL,
        "Title" text NOT NULL,
        "Body" text NOT NULL,
        "Data" text,
        "IsRead" boolean NOT NULL,
        "SentVia" text[] NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "PasswordResetTokens" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "TokenHash" text NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "IsUsed" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_PasswordResetTokens" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Payments" (
        "Id" uuid NOT NULL,
        "BookingId" uuid NOT NULL,
        "Provider" integer NOT NULL,
        "ProviderOrderId" text,
        "ProviderPaymentId" text,
        "ProviderSignature" text,
        "ProviderPayload" text,
        "Amount" numeric(10,2) NOT NULL,
        "Currency" text NOT NULL,
        "Method" text,
        "Status" integer NOT NULL,
        "IdempotencyKey" text,
        "RefundId" text,
        "RefundAmount" numeric(10,2),
        "CapturedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Payments" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "RemindMes" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "MovieId" uuid,
        "EventId" uuid,
        "Notified" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_RemindMes" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Reviews" (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "MovieId" uuid,
        "EventId" uuid,
        "Rating" integer NOT NULL,
        "Title" text,
        "Body" text,
        "ThumbsUp" integer NOT NULL,
        "ThumbsDown" integer NOT NULL,
        "IsVerifiedBooking" boolean NOT NULL,
        "Status" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Reviews" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Screens" (
        "Id" uuid NOT NULL,
        "VenueId" uuid NOT NULL,
        "Name" text NOT NULL,
        "Layout" text,
        "TotalSeats" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Screens" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "SeatLocks" (
        "Id" uuid NOT NULL,
        "ShowId" uuid NOT NULL,
        "SeatLabel" text NOT NULL,
        "UserId" uuid,
        "SessionId" text,
        "CreatedAt" timestamp with time zone NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SeatLocks" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Settings" (
        "Key" character varying(100) NOT NULL,
        "Value" text NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Settings" PRIMARY KEY ("Key")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Shows" (
        "Id" uuid NOT NULL,
        "ScreenId" uuid NOT NULL,
        "VenueId" uuid NOT NULL,
        "MovieId" uuid,
        "EventId" uuid,
        "ShowDate" date NOT NULL,
        "ShowTime" time without time zone NOT NULL,
        "ShowDatetime" timestamp with time zone NOT NULL,
        "Format" text,
        "Language" text,
        "PriceOverrides" text,
        "Status" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Shows" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Users" (
        "Id" uuid NOT NULL,
        "Email" text NOT NULL,
        "Mobile" text NOT NULL,
        "PasswordHash" text NOT NULL,
        "Name" text NOT NULL,
        "Dob" date,
        "Gender" text,
        "CityId" uuid,
        "StateCode" text,
        "ProfilePicUrl" text,
        "Role" integer NOT NULL,
        "EmailVerified" boolean NOT NULL,
        "IsBlocked" boolean NOT NULL,
        "Preferences" text,
        "RefreshToken" text,
        "RefreshTokenExpiresAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE TABLE "Venues" (
        "Id" uuid NOT NULL,
        "Name" text NOT NULL,
        "Slug" text NOT NULL,
        "Chain" text,
        "Address" text NOT NULL,
        "CityId" uuid NOT NULL,
        "StateCode" text,
        "Latitude" double precision NOT NULL,
        "Longitude" double precision NOT NULL,
        "Amenities" text,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Venues" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_AuditLogs_EntityType" ON "AuditLogs" ("EntityType");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_AuditLogs_UserId" ON "AuditLogs" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Bookings_BookingRef" ON "Bookings" ("BookingRef");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Bookings_CouponId" ON "Bookings" ("CouponId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Bookings_ShowId" ON "Bookings" ("ShowId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Bookings_UserId" ON "Bookings" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_BookingSeats_BookingId" ON "BookingSeats" ("BookingId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Cities_Slug" ON "Cities" ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Coupons_Code" ON "Coupons" ("Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_CouponUsages_BookingId" ON "CouponUsages" ("BookingId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_CouponUsages_CouponId" ON "CouponUsages" ("CouponId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_CouponUsages_UserId" ON "CouponUsages" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Events_Slug" ON "Events" ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Events_VenueId" ON "Events" ("VenueId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_IdempotencyKeys_UserId" ON "IdempotencyKeys" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Movies_Slug" ON "Movies" ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Notifications_UserId" ON "Notifications" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_PasswordResetTokens_TokenHash" ON "PasswordResetTokens" ("TokenHash");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_PasswordResetTokens_UserId" ON "PasswordResetTokens" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Payments_BookingId" ON "Payments" ("BookingId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Payments_IdempotencyKey" ON "Payments" ("IdempotencyKey");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Payments_ProviderOrderId" ON "Payments" ("ProviderOrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_RemindMes_MovieId" ON "RemindMes" ("MovieId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_RemindMes_UserId" ON "RemindMes" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Reviews_EventId" ON "Reviews" ("EventId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Reviews_MovieId" ON "Reviews" ("MovieId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Reviews_UserId" ON "Reviews" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Screens_VenueId" ON "Screens" ("VenueId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_SeatLocks_ShowId" ON "SeatLocks" ("ShowId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_SeatLocks_ShowId_SeatLabel" ON "SeatLocks" ("ShowId", "SeatLabel");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Shows_EventId" ON "Shows" ("EventId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Shows_MovieId" ON "Shows" ("MovieId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Shows_MovieId_ShowDate" ON "Shows" ("MovieId", "ShowDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Shows_ScreenId" ON "Shows" ("ScreenId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Shows_VenueId" ON "Shows" ("VenueId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Users_CityId" ON "Users" ("CityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Users_Mobile" ON "Users" ("Mobile");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE INDEX "IX_Venues_CityId" ON "Venues" ("CityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Venues_Slug" ON "Venues" ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260509132740_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260509132740_InitialCreate', '8.0.12');
    END IF;
END $EF$;
COMMIT;

