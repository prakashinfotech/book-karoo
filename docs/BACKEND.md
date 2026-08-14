# BookKaroo — Backend Developer Guide

> Patterns and conventions for the .NET 8 Web API.
> Auto-loaded rules: [.claude/rules/backend-standards.md](../.claude/rules/backend-standards.md)
> API contracts: [docs/API.md](API.md) | Schema: [docs/DATABASE.md](DATABASE.md)

---

## Solution Structure

```
backend/
├── src/
│   ├── BookKaroo.Api/                  # HTTP layer — configure once, thin controllers
│   │   ├── Controllers/                # One per domain
│   │   │   ├── MoviesController.cs, BookingsController.cs, PaymentsController.cs, ...
│   │   │   ├── AdminController.cs / AdminPartnerController.cs / AdminLysController.cs   # Admin panel API
│   │   │   ├── PartnerController.cs / PartnerLysController.cs                            # Partner portal API
│   │   │   ├── LysController.cs                                                          # Organizer self-serve (List Your Show)
│   │   │   └── ChatbotController.cs                                                      # Groq-backed AI assistant
│   │   ├── Middleware/
│   │   │   ├── GlobalExceptionMiddleware.cs   # Maps custom exceptions → ProblemDetails
│   │   │   └── AdminAuthMiddleware.cs         # Checks role=admin claim
│   │   ├── BackgroundServices/
│   │   │   └── SeatLockSweepService.cs        # Cron: delete expired locks every 60s
│   │   └── Program.cs                         # DI wiring, middleware pipeline
│   │
│   ├── BookKaroo.Application/          # Business logic — most active layer
│   │   ├── Services/
│   │   │   ├── MovieService.cs
│   │   │   ├── BookingService.cs
│   │   │   ├── PricingService.cs       # GST breakdown calculations
│   │   │   └── ...
│   │   ├── Interfaces/
│   │   │   ├── Services/               # IMovieService, IBookingService, etc.
│   │   │   └── Repositories/           # IMovieRepository, IBookingRepository, etc.
│   │   ├── DTOs/
│   │   │   ├── Movies/                 # CreateMovieRequest, MovieResponse, MovieFilterRequest
│   │   │   ├── Booking/                # CreateBookingRequest, BookingResponse, PricingBreakdown
│   │   │   ├── Auth/                   # LoginRequest, SignupRequest, TokenResponse
│   │   │   └── [feature]/
│   │   ├── Validators/                 # One per request DTO
│   │   │   ├── CreateMovieRequestValidator.cs
│   │   │   └── ...
│   │   └── Exceptions/
│   │       ├── NotFoundException.cs
│   │       ├── ConflictException.cs
│   │       ├── ValidationException.cs
│   │       └── UnauthorizedException.cs
│   │
│   ├── BookKaroo.Domain/               # Pure model — no dependencies
│   │   ├── Entities/
│   │   │   ├── Movie.cs, Show.cs, Booking.cs, SeatLock.cs, EventTicketLock.cs, ...
│   │   │   └── PartnerProfile.cs, PartnerVenueAccess.cs, LysOrganizer.cs, LysEvent.cs, LysUpload.cs
│   │   └── Enums/
│   │       ├── BookingStatus.cs
│   │       ├── SeatCategory.cs
│   │       ├── PaymentStatus.cs
│   │       └── ...
│   │
│   └── BookKaroo.Infrastructure/       # Data access + external integrations
│       ├── Data/
│       │   ├── BookKarooDbContext.cs    # EF Core context, global query filters
│       │   └── Migrations/             # EF migration files
│       ├── Repositories/               # IXxxRepository implementations
│       ├── Payment/
│       │   ├── MockPaymentProvider.cs
│       │   └── RazorpayPaymentProvider.cs
│       ├── Email/                      # Resend client wrapper
│       ├── Pdf/                        # QuestPDF invoice generator
│       ├── Storage/                    # Supabase Storage client (QR, invoices)
│       └── ExternalServices/           # TMDB API client
│
└── tests/
    └── BookKaroo.Tests/
        ├── Services/                   # Unit tests (mock repos)
        ├── Validators/                 # FluentValidation tests
        └── Repositories/              # Integration tests (real DB)
```

---

## Layer Rules (Strict — No Skipping)

```
Controller    → Service only         (no direct repo or DbContext access)
Service       → Repository only      (no direct DbContext access)
Repository    → DbContext only        (no business logic)
```

---

## Controller Pattern (thin)

```csharp
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService _movieService;

    public MoviesController(IMovieService movieService) => _movieService = movieService;

    [HttpGet]
    public async Task<ActionResult<PagedResponse<MovieResponse>>> GetAll(
        [FromQuery] MovieFilterRequest filters,
        CancellationToken ct)
        => Ok(await _movieService.GetAllAsync(filters, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MovieResponse>> GetById(Guid id, CancellationToken ct)
        => Ok(await _movieService.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MovieResponse>> Create(
        [FromBody] CreateMovieRequest request,
        CancellationToken ct)
    {
        var movie = await _movieService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = movie.Id }, movie);
    }
}
// Rule: No business logic in controllers. Model bind → call service → return result.
```

---

## Service Pattern

```csharp
public class MovieService : IMovieService
{
    private readonly IMovieRepository _movieRepo;
    private readonly ILogger<MovieService> _logger;

    public MovieService(IMovieRepository movieRepo, ILogger<MovieService> logger)
    {
        _movieRepo = movieRepo;
        _logger = logger;
    }

    public async Task<PagedResponse<MovieResponse>> GetAllAsync(
        MovieFilterRequest filters, CancellationToken ct)
    {
        _logger.LogInformation("Fetching movies {Filters}", filters);
        var (movies, total) = await _movieRepo.GetFilteredAsync(filters, ct);
        return new PagedResponse<MovieResponse>(movies.Select(MapToResponse), total, filters.Page, filters.PageSize);
    }

    public async Task<MovieResponse> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var movie = await _movieRepo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Movie {id} not found");
        return MapToResponse(movie);
    }

    private static MovieResponse MapToResponse(Movie m) => new(m.Id, m.Title, m.PosterUrl, ...);
}
```

---

## Repository Pattern

```csharp
public class MovieRepository : IMovieRepository
{
    private readonly BookKarooDbContext _db;

    public MovieRepository(BookKarooDbContext db) => _db = db;

    public async Task<Movie?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _db.Movies.FirstOrDefaultAsync(m => m.Id == id, ct);
    // EF global query filter already excludes deleted_at IS NOT NULL

    public async Task<(IEnumerable<Movie>, int)> GetFilteredAsync(
        MovieFilterRequest filters, CancellationToken ct)
    {
        var query = _db.Movies.AsQueryable();

        if (filters.GenreIds?.Any() == true)
            query = query.Where(m => m.Genres.Any(g => filters.GenreIds.Contains(g.Id)));

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync(ct);

        return (items, total);
    }
}
// Rule: Data access only. No business logic. No throwing NotFoundException here.
```

---

## Exception Handling Pattern

```csharp
// In services — throw typed exceptions:
throw new NotFoundException($"Show {showId} not found");
throw new ConflictException($"Seat {seatId} is already locked");
throw new ValidationException("Cannot book more than 10 seats per transaction");

// GlobalExceptionMiddleware maps these to ProblemDetails:
// NotFoundException      → 404
// ConflictException      → 409
// ValidationException    → 422  (business rule, not FluentValidation)
// UnauthorizedException  → 401
// ForbiddenException     → 403
// Any other exception    → 500 (+ log with Error level)
```

---

## FluentValidation Pattern

```csharp
// One validator per request DTO
public class CreateMovieRequestValidator : AbstractValidator<CreateMovieRequest>
{
    public CreateMovieRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ReleaseDate).NotEmpty().LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.AddYears(2)));
        RuleFor(x => x.DurationMinutes).InclusiveBetween(1, 600);
        RuleFor(x => x.TmdbId).GreaterThan(0).When(x => x.TmdbId.HasValue);
    }
}
// Auto-registered in DI. Runs before controller action. Returns 422 on failure.
```

---

## GST Pricing Service

```csharp
// Application/Services/PricingService.cs
public PricingBreakdown Calculate(
    decimal ticketBasePrice,
    int quantity,
    string customerStateCode,
    bool hasCoupon)
{
    const string CompanyStateCode = "24"; // Gujarat
    var convenienceFee = 59.00m * quantity;
    var offerFee = hasCoupon ? 15.00m * quantity : 0m;
    var taxableAmount = convenienceFee + offerFee;

    bool isIntraState = customerStateCode == CompanyStateCode;
    return isIntraState
        ? new PricingBreakdown(ticketBasePrice * quantity, convenienceFee, offerFee,
            cgst: taxableAmount * 0.09m, sgst: taxableAmount * 0.09m, igst: 0m)
        : new PricingBreakdown(ticketBasePrice * quantity, convenienceFee, offerFee,
            cgst: 0m, sgst: 0m, igst: taxableAmount * 0.18m);
}
// Money: always decimal. Never float.
```

---

## Payment Provider Pattern

```csharp
// IPaymentProvider — Application/Interfaces/IPaymentProvider.cs
public interface IPaymentProvider
{
    string ProviderName { get; }
    Task<PaymentOrder> CreateOrderAsync(CreateOrderRequest req, CancellationToken ct);
    Task<PaymentCapture> CaptureAsync(string providerOrderId, CancellationToken ct);
    Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, CancellationToken ct);
}

// MockPaymentProvider — throws in Production
public class MockPaymentProvider : IPaymentProvider
{
    public MockPaymentProvider(IHostEnvironment env)
    {
        if (env.IsProduction())
            throw new InvalidOperationException("MockPaymentProvider must not run in Production.");
    }
    // Returns synthetic success unless request has simulateFailure=true
}

// DI registration in Program.cs
var provider = builder.Configuration["PAYMENT_PROVIDER"] switch {
    "razorpay" => (IPaymentProvider)new RazorpayPaymentProvider(config),
    _          => new MockPaymentProvider(env)
};
builder.Services.AddSingleton(provider);
```

---

## Seat Lock Critical Section

```csharp
// SeatLockService.LockSeatAsync
public async Task LockSeatAsync(Guid showId, Guid seatId, Guid userId, CancellationToken ct)
{
    // 1. Advisory lock (hash on seatId + showId for uniqueness)
    var lockKey = HashToLong(showId, seatId);
    var acquired = await _db.Database
        .ExecuteSqlRawAsync("SELECT pg_try_advisory_lock({0})", lockKey);

    if (acquired == 0)
        throw new ConflictException($"Seat {seatId} is currently being reserved by another user");

    // 2. Check not already permanently booked
    var booked = await _db.BookingSeats.AnyAsync(bs => bs.SeatId == seatId && bs.ShowId == showId, ct);
    if (booked) throw new ConflictException($"Seat {seatId} is already booked");

    // 3. Insert lock row
    await _db.SeatLocks.AddAsync(new SeatLock {
        SeatId = seatId, ShowId = showId, UserId = userId,
        ExpiresAt = DateTime.UtcNow.AddMinutes(8)
    }, ct);
    await _db.SaveChangesAsync(ct);
    // Supabase Realtime broadcasts INSERT event to channel "show:{showId}"
}
```

---

## Idempotency on Payment Endpoints

```csharp
// POST /api/payments/order — requires Idempotency-Key header (UUID)
[HttpPost("order")]
public async Task<ActionResult<PaymentOrderResponse>> CreateOrder(
    [FromHeader(Name = "Idempotency-Key")] string idempotencyKey,
    [FromBody] CreateOrderRequest request,
    CancellationToken ct)
{
    var cached = await _idempotencyService.GetAsync(idempotencyKey, ct);
    if (cached != null) return Ok(cached);        // replay cached response

    var result = await _paymentService.CreateOrderAsync(request, ct);
    await _idempotencyService.StoreAsync(idempotencyKey, result, TimeSpan.FromHours(24), ct);
    return Ok(result);
}
```

---

## EF Core Setup Notes

```csharp
// Global query filter — auto-excludes soft-deleted rows from ALL queries
modelBuilder.Entity<Movie>().HasQueryFilter(m => m.DeletedAt == null);
// Applied to all entities with DeletedAt in OnModelCreating

// No FK constraints — but still configure navigation for Include() to work
modelBuilder.Entity<Booking>()
    .HasOne<User>().WithMany().HasForeignKey(b => b.UserId).HasConstraintName(null);
//  ↑ tells EF about the relationship without adding a DB constraint

// Money columns
modelBuilder.Entity<Booking>()
    .Property(b => b.TicketAmount).HasColumnType("numeric(10,2)");
```

---

## Migrations

```bash
# From backend root
cd src/BookKaroo.Api
dotnet ef migrations add <MigrationName> --project ../BookKaroo.Infrastructure
dotnet ef database update

# Naming convention: 001_InitialCreate, 002_AddSeatLocks, 009_SeatLocksReplicaIdentity
```

---

## Logging Rules

```csharp
// ✅ Correct — structured, no concatenation
_logger.LogInformation("Booking created {BookingId} for user {UserId}", booking.Id, userId);
_logger.LogError(ex, "Payment capture failed for order {OrderId}", orderId);

// ❌ Wrong — string concat loses structure
_logger.LogInformation("Booking created " + bookingId + " for user " + userId);
```

---

## DbContext Thread Safety

`BookKarooDbContext` is **not** thread-safe. Never use `Task.WhenAll` across multiple service calls sharing one DbContext instance within a request — await them sequentially instead. (`HomeController` is the canonical example of doing this correctly.)

---

## Schema Source of Truth

The live database uses `PascalCase` tables (`"Users"`, `"Bookings"`, ...), but no single script fully reproduces it: the EF Core migrations under `BookKaroo.Infrastructure/Data/Migrations/` only cover 21 of 27 tables; `backend/database/migrations/*.sql` (hand-written, also PascalCase) is actually the more complete source, covering 26 of 27; `LysOrganizers`/`LysEvents`/`LysUploads` are additionally self-created via raw `CREATE TABLE IF NOT EXISTS` SQL in `Program.cs` on every boot; and `EventTicketLocks` has no creation script anywhere despite existing live. Full detail: [docs/DATABASE.md](DATABASE.md).

---

*Related: [docs/DATABASE.md](DATABASE.md) | [docs/API.md](API.md) | [.claude/rules/backend-standards.md](../.claude/rules/backend-standards.md)*
