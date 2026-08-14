using System.Text;
using AspNetCoreRateLimit;
using BookKaroo.Api.BackgroundServices;
using BookKaroo.Api.Middleware;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Application.Services;
using BookKaroo.Application.Validators;
using BookKaroo.Infrastructure.Data;
using BookKaroo.Infrastructure.Email;
using BookKaroo.Infrastructure.Payment;
using BookKaroo.Infrastructure.Services;
using BookKaroo.Infrastructure.Repositories;
using BookKaroo.Infrastructure.ExternalServices;
using BookKaroo.Infrastructure.Pdf;
using BookKaroo.Infrastructure.Storage;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using Serilog;

// ── Serilog bootstrap logger ──────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 1. Serilog
    builder.Host.UseSerilog((ctx, services, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .ReadFrom.Services(services));

    // 2. DbContext
    var rawConnectionString = builder.Configuration["DATABASE_URL"];

    // Normalise postgresql:// URI → ADO.NET key-value format that Npgsql and
    // health-check libraries both accept. Handles '@' inside passwords by
    // splitting on the LAST '@' (which always separates userinfo from host).
    static string NormalizeConnectionString(string cs)
    {
        if (string.IsNullOrWhiteSpace(cs)) return cs;
        if (!cs.StartsWith("postgresql://") && !cs.StartsWith("postgres://"))
            return cs;

        // Strip scheme
        var withoutScheme = cs[(cs.IndexOf("://", StringComparison.Ordinal) + 3)..];

        // The host starts after the LAST '@' in the string
        var lastAt = withoutScheme.LastIndexOf('@');
        var userInfo  = withoutScheme[..lastAt];
        var hostPart  = withoutScheme[(lastAt + 1)..];

        // Split userInfo into username : password (limit 2 to keep ':' inside password)
        var colonIdx = userInfo.IndexOf(':');
        var username = colonIdx >= 0 ? Uri.UnescapeDataString(userInfo[..colonIdx]) : Uri.UnescapeDataString(userInfo);
        var password = colonIdx >= 0 ? Uri.UnescapeDataString(userInfo[(colonIdx + 1)..]) : string.Empty;

        // Parse host:port/database
        var slashIdx = hostPart.IndexOf('/');
        var hostPort = slashIdx >= 0 ? hostPart[..slashIdx] : hostPart;
        var database = slashIdx >= 0 ? hostPart[(slashIdx + 1)..] : "postgres";

        var portColon = hostPort.LastIndexOf(':');
        var host = portColon >= 0 ? hostPort[..portColon] : hostPort;
        var port = portColon >= 0 ? hostPort[(portColon + 1)..] : "5432";

        // Escape password special chars for ADO.NET (wrap in quotes if needed)
        var safePassword = password.Contains(';') || password.Contains('\'')
            ? $"'{password.Replace("'", "\\'")}'"
            : password;

        return $"Host={host};Port={port};Database={database};Username={username};Password={safePassword};SSL Mode=Require;Trust Server Certificate=true";
    }

    var connectionString = NormalizeConnectionString(rawConnectionString ?? string.Empty);

    if (string.IsNullOrWhiteSpace(rawConnectionString))
    {
        if (builder.Environment.IsProduction())
            throw new InvalidOperationException("DATABASE_URL is required in Production.");

        Log.Warning("DATABASE_URL not set — using in-memory database for local dev. " +
                    "Set DATABASE_URL in launchSettings.json to connect to Supabase Postgres.");

        builder.Services.AddDbContext<BookKarooDbContext>(opt =>
            opt.UseInMemoryDatabase("BookKaroo_Dev"));
    }
    else
    {
        Log.Information("Connecting to Postgres at {Host}", connectionString.Split(';').FirstOrDefault(p => p.StartsWith("Host=")) ?? "unknown");
        builder.Services.AddDbContext<BookKarooDbContext>(opt =>
            opt.UseNpgsql(connectionString,
                npgsql => npgsql.EnableRetryOnFailure(3)));
    }

    // 3. JWT Authentication
    var jwtSecret = builder.Configuration["JWT_SECRET"]
        ?? throw new InvalidOperationException("JWT_SECRET is required.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["JWT_ISSUER"] ?? "bookkaroo",
                ValidAudience = builder.Configuration["JWT_AUDIENCE"] ?? "bookkaroo-api",
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew = TimeSpan.FromSeconds(30)
            };
        });

    builder.Services.AddAuthorization();

    // 4. FluentValidation
    builder.Services.AddFluentValidationAutoValidation();
    builder.Services.AddValidatorsFromAssemblyContaining<SignupRequestValidator>();

    // 6. Rate limiting (AspNetCoreRateLimit)
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // 7. CORS
    // AllowCredentials() is required because the frontend sends withCredentials:true
    // (the httpOnly refresh-token cookie). Per the CORS spec, AllowAnyOrigin() cannot
    // be combined with AllowCredentials() — so origins must be an explicit allowlist,
    // never a reflect-any-origin predicate, or any external site could ride a logged-in
    // user's cookie into authenticated cross-origin requests.
    var corsAllowedOrigins = (builder.Configuration["CORS_ALLOWED_ORIGINS"] ?? "http://localhost:5173,http://localhost:3000")
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
            policy.WithOrigins(corsAllowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials());
    });

    // 8. Swagger with JWT
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(opt =>
    {
        opt.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "BookKaroo API",
            Version = "v1",
            Description = "BookKaroo entertainment ticket booking platform — Phase 1 MVP"
        });

        opt.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter your JWT token"
        });

        opt.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                []
            }
        });
    });

    // 9. Health checks — use the already-normalised ADO.NET connection string
    var hcBuilder = builder.Services.AddHealthChecks();
    if (!string.IsNullOrWhiteSpace(rawConnectionString))
        hcBuilder.AddNpgSql(connectionString, name: "database");

    // 10. QuestPDF license
    QuestPDF.Settings.License = LicenseType.Community;

    // 11. IPaymentProvider — select based on PAYMENT_PROVIDER env var
    var paymentProvider = builder.Configuration["PAYMENT_PROVIDER"] ?? "mock";
    switch (paymentProvider.ToLowerInvariant())
    {
        case "razorpay":
            builder.Services.AddScoped<IPaymentProvider, RazorpayPaymentProvider>();
            break;
        default:
            builder.Services.AddScoped<IPaymentProvider, MockPaymentProvider>();
            break;
    }

    // 12. HttpClient
    builder.Services.AddHttpClient();

    // Groq named client — auth header is set per-request inside GroqService
    builder.Services.AddHttpClient("groq", client =>
    {
        client.BaseAddress = new Uri("https://api.groq.com/");
    });

    // 13. Repositories (Scoped)
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<ICityRepository, CityRepository>();
    builder.Services.AddScoped<IMovieRepository, MovieRepository>();
    builder.Services.AddScoped<IShowRepository, ShowRepository>();
    builder.Services.AddScoped<IBookingRepository, BookingRepository>();
    builder.Services.AddScoped<IVenueRepository, VenueRepository>();
    builder.Services.AddScoped<IRepository<BookKaroo.Domain.Entities.Venue>>(sp => sp.GetRequiredService<IVenueRepository>());
    builder.Services.AddScoped<IScreenRepository, ScreenRepository>();
    builder.Services.AddScoped<IRepository<BookKaroo.Domain.Entities.Screen>>(sp => sp.GetRequiredService<IScreenRepository>());
    builder.Services.AddScoped<ISeatLockRepository, SeatLockRepository>();
    builder.Services.AddScoped<ICouponRepository, CouponRepository>();
    builder.Services.AddScoped<ISettingRepository, SettingRepository>();
    builder.Services.AddScoped<IRemindMeRepository, RemindMeRepository>();
    builder.Services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
    builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
    builder.Services.AddScoped<IEventRepository, EventRepository>();
    builder.Services.AddScoped<IEventTicketLockRepository, EventTicketLockRepository>();
    builder.Services.AddScoped<ICmsBannerRepository, CmsBannerRepository>();
    builder.Services.AddScoped<IAdminRepository, AdminRepository>();
    builder.Services.AddScoped<IPartnerRepository, PartnerRepository>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Repositories.ILysOrganizerRepository, BookKaroo.Infrastructure.Repositories.LysOrganizerRepository>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Repositories.ILysEventRepository, BookKaroo.Infrastructure.Repositories.LysEventRepository>();

    // 14. Services (Scoped)
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<ICityService, CityService>();
    builder.Services.AddScoped<IMovieService, MovieService>();
    builder.Services.AddScoped<IShowService, ShowService>();
    builder.Services.AddScoped<IReviewService, ReviewService>();
    builder.Services.AddScoped<IAdminService, AdminService>();
    builder.Services.AddScoped<IPricingService, PricingService>();
    builder.Services.AddScoped<ICouponService, CouponService>();
    builder.Services.AddScoped<IBookingService, BookingService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IPaymentService, PaymentService>();
    builder.Services.AddScoped<ISeatLockService, SeatLockService>();
    builder.Services.AddScoped<ISearchService, SearchService>();
    builder.Services.AddScoped<IEventService, EventService>();
    builder.Services.AddScoped<ICmsBannerService, CmsBannerService>();
    builder.Services.AddScoped<IAuditLogService, AuditLogService>();
    builder.Services.AddScoped<ITmdbService, TmdbService>();
    builder.Services.AddHostedService<SeatLockSweepService>();
    builder.Services.AddScoped<IEmailService, ResendEmailService>();
    builder.Services.AddScoped<IInvoicePdfGenerator, QuestPdfInvoiceGenerator>();
    builder.Services.AddScoped<BookKaroo.Application.Services.InvoiceBuilder>();
    builder.Services.AddScoped<SupabaseStorageService>();

    // Chatbot
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.ExternalServices.IGroqService, GroqService>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.IChatbotQueryService, BookKaroo.Infrastructure.Services.ChatbotQueryService>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.IChatbotService, ChatbotService>();

    // LYS — ListYourShow
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.ILysOrganizerService, BookKaroo.Application.Services.LysOrganizerService>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.ILysEventService, BookKaroo.Application.Services.LysEventService>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.ILysAdminService, BookKaroo.Application.Services.LysAdminService>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.ILysImageUploadService, BookKaroo.Infrastructure.Storage.LysImageUploadService>();
    builder.Services.AddScoped<BookKaroo.Application.Interfaces.Services.ILysPartnerService, BookKaroo.Application.Services.LysPartnerService>();

    // Partner Portal
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<BookKaroo.Application.Common.IPartnerContext, BookKaroo.Infrastructure.Auth.PartnerContext>();
    builder.Services.AddScoped<IPartnerDashboardService, BookKaroo.Infrastructure.Services.Partner.PartnerDashboardService>();
    builder.Services.AddScoped<IPartnerVenueService, BookKaroo.Infrastructure.Services.Partner.PartnerVenueService>();
    builder.Services.AddScoped<IPartnerShowService, BookKaroo.Infrastructure.Services.Partner.PartnerShowService>();
    builder.Services.AddScoped<IPartnerBookingService, BookKaroo.Infrastructure.Services.Partner.PartnerBookingService>();
    builder.Services.AddScoped<IPartnerReviewService, BookKaroo.Infrastructure.Services.Partner.PartnerReviewService>();
    builder.Services.AddScoped<IAdminPartnerService, BookKaroo.Infrastructure.Services.Partner.AdminPartnerService>();

    // 15. Controllers
    builder.Services.AddControllers()
        .AddJsonOptions(o =>
            o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));

    // ── Listen on PORT (Render / Railway / Fly inject this at runtime) ───────
    // ASP.NET Core does NOT automatically read $PORT — it needs ASPNETCORE_URLS
    // or explicit Kestrel config. Without this the app defaults to port 5000
    // while Render health-checks $PORT → mismatch → "Application exited early".
    // Skip if ASPNETCORE_URLS is already set so manual overrides still work.
    if (string.IsNullOrEmpty(builder.Configuration["ASPNETCORE_URLS"]))
    {
        var listenPort = builder.Configuration["PORT"] ?? "10000";
        builder.WebHost.UseUrls($"http://0.0.0.0:{listenPort}");
        Log.Information("Listening on http://0.0.0.0:{Port}", listenPort);
    }

    // ── Build app ─────────────────────────────────────────────────────────────
    var app = builder.Build();

    // 16. Correlation ID (before everything else for full tracing)
    app.UseCorrelationId();

    // 17. CORS must run BEFORE exception handler so error responses include
    //     Access-Control-Allow-Origin headers — without this the browser blocks
    //     5xx responses and Axios sees them as network errors (no response object).
    app.UseCors();

    // 18. Global exception handler (after CORS so error responses have CORS headers)
    app.UseGlobalExceptionHandler();

    // 19. Rate limiting
    app.UseIpRateLimiting();

    // 20. Auth
    app.UseAuthentication();
    app.UseAuthorization();

    // 21. Serilog request logging
    app.UseSerilogRequestLogging();

    // 22. Controllers
    app.MapControllers();

    // 23. Health checks — enhanced response via HealthController at GET /health
    //     The built-in health check middleware is registered for internal tooling only.
    app.MapHealthChecks("/healthz");

    // 24. Swagger (always available in non-production; can be gated by env)
    if (!app.Environment.IsProduction())
    {
        app.UseSwagger();
        app.UseSwaggerUI(opt =>
        {
            opt.SwaggerEndpoint("/swagger/v1/swagger.json", "BookKaroo API v1");
            opt.RoutePrefix = "swagger";
        });
    }

    // 25. Startup DB migration — creates LYS tables if they don't exist yet
    await ApplyLysMigrationAsync(app);

    Log.Information("BookKaroo API starting in {Environment} mode", app.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "BookKaroo API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// ── LYS startup migration — runs on every boot, all statements are idempotent ──
static async Task ApplyLysMigrationAsync(WebApplication app)
{
    const string sql = """
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

        CREATE TABLE IF NOT EXISTS "LysEvents" (
            "Id"                  uuid         NOT NULL DEFAULT gen_random_uuid(),
            "OrganizerId"         uuid         NOT NULL,
            "Title"               text         NOT NULL,
            "Slug"                text         NOT NULL,
            "Type"                text         NOT NULL,
            "Description"         text         NOT NULL,
            "VenueType"           text         NOT NULL DEFAULT 'custom',
            "VenueId"             uuid,
            "CustomVenueName"     text,
            "CustomVenueAddress"  text,
            "CustomVenueCity"     text,
            "EventDate"           timestamptz  NOT NULL,
            "DurationMin"         integer,
            "Language"            text         NOT NULL DEFAULT 'Hindi',
            "AgeRestriction"      integer      NOT NULL DEFAULT 0,
            "ArtistsJson"         text,
            "PosterUrl"           text,
            "BackdropUrl"         text,
            "PriceTiersJson"      text         NOT NULL DEFAULT '[]',
            "Status"              text         NOT NULL DEFAULT 'draft',
            "SubmittedAt"         timestamptz,
            "ReviewedAt"          timestamptz,
            "ReviewedBy"          uuid,
            "ReviewNotes"         text,
            "CommissionRate"      numeric(5,2) NOT NULL DEFAULT 5.00,
            "PublishedEventId"    uuid,
            "CreatedAt"           timestamptz  NOT NULL DEFAULT now(),
            "UpdatedAt"           timestamptz  NOT NULL DEFAULT now(),
            "DeletedAt"           timestamptz,
            CONSTRAINT "PK_LysEvents" PRIMARY KEY ("Id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_LysEvents_Slug"
            ON "LysEvents" ("Slug") WHERE "DeletedAt" IS NULL;
        CREATE INDEX IF NOT EXISTS "IX_LysEvents_OrganizerId"
            ON "LysEvents" ("OrganizerId");
        CREATE INDEX IF NOT EXISTS "IX_LysEvents_Status"
            ON "LysEvents" ("Status");

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

        ALTER TABLE "Bookings"
            ADD COLUMN IF NOT EXISTS "LysEventId"      uuid,
            ADD COLUMN IF NOT EXISTS "CommissionAmount" numeric(10,2) NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "CommissionRate"   numeric(5,2)  NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS "IX_Bookings_LysEventId"
            ON "Bookings" ("LysEventId") WHERE "LysEventId" IS NOT NULL;

        ALTER TABLE "Events"
            ADD COLUMN IF NOT EXISTS "VenueName"      text,
            ADD COLUMN IF NOT EXISTS "CityName"       text,
            ADD COLUMN IF NOT EXISTS "VenueLatitude"  double precision,
            ADD COLUMN IF NOT EXISTS "VenueLongitude" double precision;

        ALTER TABLE "LysEvents"
            ADD COLUMN IF NOT EXISTS "CustomVenueLatitude"  double precision,
            ADD COLUMN IF NOT EXISTS "CustomVenueLongitude" double precision;

        ALTER TABLE "LysEvents"
            ADD COLUMN IF NOT EXISTS "RequiresPartnerApproval" boolean      NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "AssignedPartnerId"        uuid,
            ADD COLUMN IF NOT EXISTS "PartnerReviewedAt"        timestamptz,
            ADD COLUMN IF NOT EXISTS "PartnerReviewedBy"        uuid,
            ADD COLUMN IF NOT EXISTS "PartnerAction"            text,
            ADD COLUMN IF NOT EXISTS "PartnerReviewNotes"       text;
        CREATE INDEX IF NOT EXISTS "IX_LysEvents_AssignedPartnerId"
            ON "LysEvents" ("AssignedPartnerId") WHERE "AssignedPartnerId" IS NOT NULL;
        """;

    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BookKarooDbContext>();
        await db.Database.ExecuteSqlRawAsync(sql);
        Log.Information("LYS startup migration applied");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "LYS startup migration failed");
    }
}
